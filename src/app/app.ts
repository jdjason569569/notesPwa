import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from './services/note.service';
import { NoteCard } from './components/note-card';
import { NoteForm } from './components/note-form';
import { Note } from './models/note.model';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteCard, NoteForm],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  // Inject Note Service
  protected noteService = inject(NoteService);
  protected authService = inject(AuthService);

  // Filter States
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('Todas');

  // Edit State
  editingNote = signal<Note | null>(null);

  // Theme State
  isDarkMode = signal<boolean>(true);

  // PWA Install Event State
  private deferredPrompt: any = null;
  showInstallBtn = signal<boolean>(false);

  constructor() {
    // Initialize theme
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('zennotes_theme');
      const defaultDark = savedTheme === null || savedTheme === 'dark';
      this.isDarkMode.set(defaultDark);
      if (defaultDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }

  ngOnInit(): void {
    // Gyroscope Parallax Effect
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null && e.gamma !== null) {
          const maxTilt = 15;
          // Asumimos que el usuario sostiene el móvil a ~45 grados, ajustamos el centro
          let tiltX = e.beta - 45;
          let tiltY = e.gamma;

          // Limitamos el máximo grado de inclinación
          tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
          tiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY));

          // Asignamos las variables CSS de forma global
          document.documentElement.style.setProperty('--tilt-x', `${-tiltX}deg`);
          document.documentElement.style.setProperty('--tilt-y', `${tiltY}deg`);
        }
      });
    }

    // Catch beforeinstallprompt to enable custom PWA installation button
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        this.showInstallBtn.set(true);
      });

      window.addEventListener('appinstalled', () => {
        console.log('ZenNotes was successfully installed.');
        this.deferredPrompt = null;
        this.showInstallBtn.set(false);
      });
    }
  }

  // Computed properties for filtering notes
  filteredPinnedNotes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    return this.noteService.pinnedNotes().filter(note => {
      const matchesQuery = note.title.toLowerCase().includes(query) || 
                           note.content.toLowerCase().includes(query);
      const matchesCat = cat === 'Todas' || note.category === cat;
      return matchesQuery && matchesCat;
    });
  });

  filteredActiveNotes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    return this.noteService.activeNotes().filter(note => {
      const matchesQuery = note.title.toLowerCase().includes(query) || 
                           note.content.toLowerCase().includes(query);
      const matchesCat = cat === 'Todas' || note.category === cat;
      return matchesQuery && matchesCat;
    });
  });

  // Category filter selection helper
  selectCategoryFilter(category: string): void {
    this.selectedCategory.set(category);
  }

  // Theme Toggle
  toggleTheme(): void {
    this.isDarkMode.update(dark => {
      const next = !dark;
      if (typeof window !== 'undefined') {
        if (next) {
          document.body.classList.add('dark-theme');
          localStorage.setItem('zennotes_theme', 'dark');
        } else {
          document.body.classList.remove('dark-theme');
          localStorage.setItem('zennotes_theme', 'light');
        }
      }
      return next;
    });
  }

  // Haptic Feedback Helper
  private triggerHaptic(pattern: number | number[]): void {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignorar si falla o el navegador lo bloquea
      }
    }
  }

  // Save Note (Handle both create and edit)
  onSaveNote(noteData: Omit<Note, 'id' | 'createdAt'>): void {
    const currentEdit = this.editingNote();
    if (currentEdit) {
      this.noteService.updateNote(currentEdit.id, noteData);
      this.editingNote.set(null);
    } else {
      this.noteService.addNote(noteData);
    }
    // Patrón de éxito: doble toque más largo para que el hardware lo registre bien
    this.triggerHaptic([50, 50, 50]);
  }

  // Edit Trigger
  onEditNote(note: Note): void {
    this.editingNote.set(note);
    // Scroll smoothly to form when editing
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onCancelEdit(): void {
    this.editingNote.set(null);
  }

  // Delete Trigger
  onDeleteNote(id: string): void {
    this.noteService.deleteNote(id);
    if (this.editingNote()?.id === id) {
      this.editingNote.set(null);
    }
    // Patrón de borrado/advertencia: doble toque más fuerte
    this.triggerHaptic([40, 50, 40]);
  }

  // Toggle Pin Status
  onTogglePin(id: string): void {
    this.noteService.togglePin(id);
    // Patrón sutil: un solo toque muy ligero
    this.triggerHaptic(15);
  }

  // Install PWA trigger
  installPwa(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the ZenNotes PWA install prompt');
        } else {
          console.log('User dismissed the ZenNotes PWA install prompt');
        }
        this.deferredPrompt = null;
        this.showInstallBtn.set(false);
      });
    }
  }
}
