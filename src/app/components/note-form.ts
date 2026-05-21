import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../models/note.model';
import { NoteService } from '../services/note.service';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="form-card glass-panel animate-fade-in" 
      [class.expanded]="isExpanded()"
      [ngClass]="'color-' + color()"
    >
      @if (editNote()) {
        <div class="form-header-title">
          <span>Editar Nota</span>
          <button class="btn-icon" (click)="onCancel()" title="Cancelar edición">
            <span class="material-icons-round">close</span>
          </button>
        </div>
      }

      <form (submit)="onSubmit($event)">
        <!-- Title input: Visible when expanded or editing -->
        @if (isExpanded() || editNote()) {
          <input
            type="text"
            name="title"
            class="form-input title-input"
            placeholder="Título"
            [(ngModel)]="title"
            autocomplete="off"
          />
        }

        <!-- Content textarea -->
        <textarea
          name="content"
          class="form-input content-input"
          [placeholder]="isExpanded() ? 'Escribe una nota...' : 'Crear una nota...'"
          [(ngModel)]="content"
          (focus)="expandForm()"
          rows="1"
          #contentTextarea
          (input)="adjustHeight(contentTextarea)"
        ></textarea>

        <!-- Expanded controls -->
        @if (isExpanded() || editNote()) {
          <div class="form-controls animate-fade-in">
            <!-- Row 1: Category and Pin -->
            <div class="control-row">
              <div class="category-select-wrapper">
                <label for="category">Categoría:</label>
                <select id="category" name="category" [(ngModel)]="category" class="input-field select-field">
                  @for (cat of noteService.categories(); track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>

              <button 
                type="button" 
                class="btn-icon pin-toggle" 
                [class.active]="isPinned()"
                (click)="togglePin()"
                [title]="isPinned() ? 'Desfijar' : 'Fijar nota'"
              >
                <span class="material-icons-round">
                  {{ isPinned() ? 'push_pin' : 'push_pin_outlined' }}
                </span>
              </button>
            </div>

            <!-- Row 2: Color Picker -->
            <div class="color-picker-wrapper">
              <span class="picker-label">Color:</span>
              <div class="color-dots">
                @for (c of noteService.colors(); track c.name) {
                  <button
                    type="button"
                    class="color-dot"
                    [style.background-color]="c.hex"
                    [class.selected]="color() === c.name"
                    (click)="selectColor(c.name)"
                    [title]="c.name"
                  ></button>
                }
              </div>
            </div>

            <!-- Row 3: Action Buttons -->
            <div class="form-actions">
              @if (!editNote()) {
                <button type="button" class="btn btn-secondary" (click)="collapseForm()">
                  Cerrar
                </button>
              } @else {
                <button type="button" class="btn btn-secondary" (click)="onCancel()">
                  Cancelar
                </button>
              }
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!title().trim() || !content().trim()"
              >
                {{ editNote() ? 'Guardar' : 'Agregar' }}
              </button>
            </div>
          </div>
        }
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      padding: 16px 20px;
      border-radius: var(--border-radius-lg);
      border-left: 5px solid var(--note-primary);
      box-shadow: var(--shadow-md);
      transition: all var(--transition-normal);
      max-width: 600px;
      margin: 0 auto 30px auto;
      background: var(--bg-card);
    }

    .form-card.expanded {
      box-shadow: var(--shadow-lg), var(--note-glow-effect);
      border-color: var(--note-border-color);
      border-left-width: 6px;
    }

    .form-header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-family: var(--font-title);
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-input {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text-main);
      resize: none;
      font-family: inherit;
    }

    .title-input {
      font-family: var(--font-title);
      font-size: 1.15rem;
      font-weight: 600;
    }

    .content-input {
      font-size: 0.95rem;
      min-height: 40px;
      line-height: 1.5;
    }

    .form-controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid var(--border-light);
      padding-top: 16px;
      margin-top: 8px;
    }

    .control-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .category-select-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .select-field {
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      background: var(--bg-input);
      font-size: 0.85rem;
      width: 130px;
    }

    .pin-toggle {
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .pin-toggle:hover, .pin-toggle.active {
      color: var(--color-amber);
    }

    .pin-toggle.active {
      transform: rotate(45deg);
    }

    .color-picker-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .picker-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .color-dots {
      display: flex;
      gap: 8px;
    }

    .color-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .color-dot:hover {
      transform: scale(1.15);
    }

    .color-dot.selected {
      border-color: var(--text-main);
      transform: scale(1.1);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--border-color);
      color: var(--text-main);
    }

    /* Colors */
    .color-emerald {
      --note-primary: var(--color-emerald);
      --note-border-color: var(--color-emerald-border);
      --note-glow-effect: var(--glow-emerald);
    }

    .color-ocean {
      --note-primary: var(--color-ocean);
      --note-border-color: var(--color-ocean-border);
      --note-glow-effect: var(--glow-ocean);
    }

    .color-purple {
      --note-primary: var(--color-purple);
      --note-border-color: var(--color-purple-border);
      --note-glow-effect: var(--glow-purple);
    }

    .color-rose {
      --note-primary: var(--color-rose);
      --note-border-color: var(--color-rose-border);
      --note-glow-effect: var(--glow-rose);
    }

    .color-amber {
      --note-primary: var(--color-amber);
      --note-border-color: var(--color-amber-border);
      --note-glow-effect: var(--glow-amber);
    }
  `]
})
export class NoteForm {
  // Injected service
  protected noteService = inject(NoteService);

  // Signal Inputs and Outputs
  editNote = input<Note | null>(null);
  save = output<Omit<Note, 'id' | 'createdAt'>>();
  cancelEdit = output<void>();

  // Form Fields State Signals
  title = signal<string>('');
  content = signal<string>('');
  category = signal<string>('Idea');
  color = signal<string>('purple');
  isPinned = signal<boolean>(false);
  
  // Collapse State
  isExpanded = signal<boolean>(false);

  constructor() {
    // Populate form if in edit mode
    effect(() => {
      const note = this.editNote();
      if (note) {
        this.title.set(note.title);
        this.content.set(note.content);
        this.category.set(note.category);
        this.color.set(note.color);
        this.isPinned.set(note.isPinned);
        this.isExpanded.set(true);
      } else {
        this.resetForm();
      }
    });
  }

  expandForm(): void {
    if (!this.editNote()) {
      this.isExpanded.set(true);
    }
  }

  collapseForm(): void {
    if (!this.editNote()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.title.set('');
    this.content.set('');
    this.category.set('Idea');
    this.color.set('purple');
    this.isPinned.set(false);
    this.isExpanded.set(false);
  }

  selectColor(colorName: string): void {
    this.color.set(colorName);
  }

  togglePin(): void {
    this.isPinned.update(p => !p);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    console.log('[ZenNotes] onSubmit called. title:', this.title(), 'content:', this.content());
    if (!this.title().trim() || !this.content().trim()) {
      console.log('[ZenNotes] Validation failed: empty title or content');
      return;
    }

    this.save.emit({
      title: this.title().trim(),
      content: this.content().trim(),
      category: this.category(),
      color: this.color(),
      isPinned: this.isPinned()
    });
    console.log('[ZenNotes] Note emitted successfully');

    this.resetForm();
  }

  onCancel(): void {
    this.cancelEdit.emit();
    this.resetForm();
  }

  adjustHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
