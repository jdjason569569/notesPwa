import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly CREDENTIAL_ID_KEY = 'zennotes_auth_credential_id';
  
  // Para saber si en esta sesión el usuario ya se autenticó
  isAuthenticated = signal<boolean>(false);
  isBiometricSupported = signal<boolean>(false);
  hasRegisteredCredential = signal<boolean>(false);

  constructor() {
    this.checkSupport();
    this.checkExistingCredential();
  }

  private checkSupport(): void {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      // Comprobar si el dispositivo soporta autenticación de plataforma (biometría, PIN, etc.)
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          this.isBiometricSupported.set(available);
        })
        .catch(() => this.isBiometricSupported.set(false));
    }
  }

  private checkExistingCredential(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.CREDENTIAL_ID_KEY);
      this.hasRegisteredCredential.set(!!stored);
    }
  }

  private generateRandomBuffer(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Registra la huella/cara por primera vez
  async registerBiometrics(): Promise<boolean> {
    try {
      const challenge = this.generateRandomBuffer(32);
      const userId = this.generateRandomBuffer(16);

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'ZenNotes',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: 'Usuario ZenNotes',
          displayName: 'Usuario ZenNotes'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (credential) {
        // Guardar el ID de la credencial en base64 para usarlo después
        const credentialIdBase64 = this.bufferToBase64(credential.rawId);
        localStorage.setItem(this.CREDENTIAL_ID_KEY, credentialIdBase64);
        this.hasRegisteredCredential.set(true);
        this.isAuthenticated.set(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error registrando biometría:', error);
      return false;
    }
  }

  // Verifica la identidad para desbloquear notas
  async authenticate(): Promise<boolean> {
    // Si no hay credencial registrada, pedimos registrarla
    if (!this.hasRegisteredCredential()) {
      return this.registerBiometrics();
    }

    try {
      const storedIdBase64 = localStorage.getItem(this.CREDENTIAL_ID_KEY);
      if (!storedIdBase64) return false;

      const credentialId = this.base64ToBuffer(storedIdBase64);
      const challenge = this.generateRandomBuffer(32);

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: credentialId,
          type: 'public-key'
        }],
        userVerification: 'required',
        timeout: 60000
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      });

      if (assertion) {
        this.isAuthenticated.set(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      return false;
    }
  }

  lock(): void {
    this.isAuthenticated.set(false);
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
