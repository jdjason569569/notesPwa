import { Injectable, signal, computed, effect } from '@angular/core';
import { Note } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly STORAGE_KEY = 'zennotes_notes';
  
  // State Signals
  private notesSignal = signal<Note[]>([]);
  public isOnline = signal<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

  // Computed Signals
  public notes = computed(() => this.notesSignal());
  public pinnedNotes = computed(() => this.notesSignal().filter(n => n.isPinned));
  public activeNotes = computed(() => this.notesSignal().filter(n => !n.isPinned));
  
  // Categories list
  public categories = signal<string[]>(['Idea', 'Trabajo', 'Personal', 'Lista', 'Otros']);

  // Premium colors list with variables corresponding to our CSS variables
  public colors = signal<{ name: string; hex: string }[]>([
    { name: 'emerald', hex: '#10b981' },
    { name: 'ocean', hex: '#0ea5e9' },
    { name: 'purple', hex: '#8b5cf6' },
    { name: 'rose', hex: '#f43f5e' },
    { name: 'amber', hex: '#f59e0b' }
  ]);

  constructor() {
    this.notesSignal.set(this.loadNotes());

    // Automatically sync notes to localStorage on any changes
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notesSignal()));
      }
    });

    // Listen to network status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.updateOnlineStatus.bind(this));
      window.addEventListener('offline', this.updateOnlineStatus.bind(this));
    }
  }

  private updateOnlineStatus(): void {
    if (typeof window !== 'undefined') {
      this.isOnline.set(navigator.onLine);
    }
  }

  private loadNotes(): Note[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error loading notes from LocalStorage', e);
      }
    }

    // Default premium notes if storage is empty
    const defaultNotes: Note[] = [
      {
        id: '1',
        title: '💡 ¡Bienvenido a ZenNotes!',
        content: 'Esta es una aplicación de notas premium. Es una PWA (Progressive Web App), lo que significa que funciona sin conexión a internet y la puedes instalar en tu pantalla de inicio como una aplicación de escritorio o móvil.\n\nPrueba a agregar, editar y cambiar el color de las notas.',
        category: 'Idea',
        color: 'purple',
        createdAt: Date.now() - 3600000 * 2, // 2 hours ago
        isPinned: true
      },
      {
        id: '2',
        title: '⚡ Características de la PWA',
        content: '• Funciona Offline (Prueba a apagar tu red y recargar la página)\n• Registro de Service Worker para caché inteligente\n• Instalable en Android, iOS, Windows y macOS\n• Persistencia local rápida y segura',
        category: 'Trabajo',
        color: 'ocean',
        createdAt: Date.now() - 3600000, // 1 hour ago
        isPinned: true
      },
      {
        id: '3',
        title: '🎨 Notas coloridas y organizadas',
        content: 'Puedes clasificar tus notas por categorías como Trabajo, Personal, Ideas o Listas. Además, cada nota puede tener su propio color para facilitar la visualización.',
        category: 'Personal',
        color: 'emerald',
        createdAt: Date.now(),
        isPinned: false
      }
    ];

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultNotes));
    return defaultNotes;
  }

  // Add Note
  public addNote(noteData: Omit<Note, 'id' | 'createdAt'>): void {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      createdAt: Date.now()
    };
    this.notesSignal.update(notes => [newNote, ...notes]);
  }

  // Update Note
  public updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): void {
    this.notesSignal.update(notes => 
      notes.map(note => note.id === id ? { ...note, ...updates } : note)
    );
  }

  // Delete Note
  public deleteNote(id: string): void {
    this.notesSignal.update(notes => notes.filter(note => note.id !== id));
  }

  // Toggle Pin Status
  public togglePin(id: string): void {
    this.notesSignal.update(notes => 
      notes.map(note => note.id === id ? { ...note, isPinned: !note.isPinned } : note)
    );
  }
}
