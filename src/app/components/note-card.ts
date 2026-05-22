import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../models/note.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="note-card animate-fade-in" [ngClass]="'color-' + note().color">
      <!-- Card Header -->
      <div class="card-header">
        <span class="badge" [ngClass]="'badge-' + note().category.toLowerCase()">
          {{ note().category }}
        </span>
        <button 
          class="btn-icon pin-btn" 
          [class.active]="note().isPinned"
          (click)="onTogglePin($event)"
          title="Fijar nota"
        >
          <span class="material-icons-round">
            {{ note().isPinned ? 'push_pin' : 'push_pin_outlined' }}
          </span>
        </button>
      </div>

      <!-- Card Content -->
      <div class="card-body" (click)="onEdit()">
        @if (isLocked()) {
          <div class="locked-content">
            <span class="material-icons-round lock-icon">lock</span>
            <p>Nota Privada</p>
            <button class="btn btn-primary unlock-btn" (click)="onUnlock($event)">
              Desbloquear
            </button>
          </div>
        } @else {
          <h3 class="note-title">{{ note().title }}</h3>
          <p class="note-content">{{ note().content }}</p>
        }
      </div>

      <!-- Card Footer -->
      <div class="card-footer">
        <span class="note-date">
          {{ note().createdAt | date:'d MMM, y, h:mm a' }}
        </span>
        <div class="card-actions">
          <button 
            class="btn-icon edit-btn" 
            (click)="onEdit()"
            title="Editar nota"
          >
            <span class="material-icons-round">edit</span>
          </button>
          <button 
            class="btn-icon delete-btn" 
            (click)="onDelete($event)"
            title="Eliminar nota"
          >
            <span class="material-icons-round">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .note-card {
      display: flex;
      flex-direction: column;
      height: 250px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-glass);
      border-top: 4px solid var(--note-primary);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-sm);
      transition: background var(--transition-normal), box-shadow var(--transition-normal), border var(--transition-normal);
      transform: perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }

    /* Hover effect */
    .note-card:hover {
      transform: perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) translateY(-4px);
      background: var(--bg-card-hover);
      box-shadow: var(--shadow-md), var(--note-glow-effect);
      border-color: var(--note-border-color);
      border-top-width: 6px;
    }

    /* Color configurations mapping to global css variables */
    .color-emerald {
      --note-primary: var(--color-emerald);
      --note-bg-soft: var(--color-emerald-bg);
      --note-border-color: var(--color-emerald-border);
      --note-glow-effect: var(--glow-emerald);
    }

    .color-ocean {
      --note-primary: var(--color-ocean);
      --note-bg-soft: var(--color-ocean-bg);
      --note-border-color: var(--color-ocean-border);
      --note-glow-effect: var(--glow-ocean);
    }

    .color-purple {
      --note-primary: var(--color-purple);
      --note-bg-soft: var(--color-purple-bg);
      --note-border-color: var(--color-purple-border);
      --note-glow-effect: var(--glow-purple);
    }

    .color-rose {
      --note-primary: var(--color-rose);
      --note-bg-soft: var(--color-rose-bg);
      --note-border-color: var(--color-rose-border);
      --note-glow-effect: var(--glow-rose);
    }

    .color-amber {
      --note-primary: var(--color-amber);
      --note-bg-soft: var(--color-amber-bg);
      --note-border-color: var(--color-amber-border);
      --note-glow-effect: var(--glow-amber);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .pin-btn {
      color: var(--text-muted);
      opacity: 0.4;
      transition: all var(--transition-fast);
    }

    .note-card:hover .pin-btn, .pin-btn.active {
      opacity: 1;
    }

    .pin-btn.active {
      color: var(--color-amber);
      transform: rotate(45deg);
    }

    /* Card Body */
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .note-title {
      font-size: 1.1rem;
      color: var(--text-main);
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .note-content {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
      white-space: pre-line;
    }

    /* Card Footer */
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-light);
      padding-top: 12px;
      margin-top: auto;
    }

    .note-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .card-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transform: translateX(10px);
      transition: all var(--transition-normal);
    }

    .note-card:hover .card-actions {
      opacity: 1;
      transform: translateX(0);
    }

    .edit-btn:hover {
      color: var(--color-ocean);
      background: var(--color-ocean-bg);
    }

    .locked-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
      gap: 8px;
    }

    .lock-icon {
      font-size: 2.5rem;
      color: var(--color-purple);
      opacity: 0.7;
    }

    .unlock-btn {
      margin-top: 8px;
      padding: 6px 16px;
      font-size: 0.85rem;
      background: var(--color-purple);
      color: white;
      border-radius: var(--border-radius-sm);
    }
    
    .unlock-btn:hover {
      background: var(--color-purple-border);
    }

  `]
})
export class NoteCard {
  authService = inject(AuthService);

  // Signals input/output
  note = input.required<Note>();
  delete = output<string>();
  togglePin = output<string>();
  edit = output<Note>();

  isLocked(): boolean {
    return this.note().isPrivate && !this.authService.isAuthenticated();
  }

  async onUnlock(event: Event): Promise<void> {
    event.stopPropagation();
    const success = await this.authService.authenticate();
    if (!success) {
      alert('Autenticación fallida o cancelada.');
    }
  }

  onTogglePin(event: Event): void {
    event.stopPropagation(); // Avoid triggering edit action on parent click
    this.togglePin.emit(this.note().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation(); // Avoid triggering edit action
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      this.delete.emit(this.note().id);
    }
  }

  onEdit(): void {
    if (this.isLocked()) {
      return; // Do not allow editing if locked
    }
    this.edit.emit(this.note());
  }
}
