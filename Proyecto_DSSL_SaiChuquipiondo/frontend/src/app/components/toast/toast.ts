import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Array<Toast & { id: number; visible: boolean }> = [];
  private subscription?: Subscription;
  private nextId = 0;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe((toast) => {
      this.addToast(toast);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private addToast(toast: Toast) {
    const id = this.nextId++;
    const toastWithId = { ...toast, id, visible: true };
    
    this.toasts.push(toastWithId);

    // Auto-remove after duration
    setTimeout(() => {
      toastWithId.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 300); // Wait for fade-out animation
    }, toast.duration || 3000);
  }

  removeToast(id: number) {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 300);
    }
  }
}
