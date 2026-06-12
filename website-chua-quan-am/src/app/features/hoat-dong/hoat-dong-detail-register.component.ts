import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  EventCapacity,
  RegistrationPayload,
  SanityService,
} from '../../core/services/sanity.service';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Registration form embedded inside the event detail page.
 *
 * Self-contained: fetches its own capacity, renders the form, submits to
 * /api/registrations, and displays the result. Parent only needs to pass
 * the eventSlug.
 *
 * Capacity rules:
 * - capacity = null → event has no `maxAttendees` set → form is hidden
 *   entirely (event is "info only", no online registration).
 * - peopleSum >= maxAttendees → form shows but in "đã đầy" mode (read-only).
 * - otherwise → form is open. Submit honors the backend's capacity check too,
 *   covering the race where two users submit simultaneously.
 */
@Component({
  selector: 'app-hoat-dong-detail-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hoat-dong-detail-register.component.html',
})
export class HoatDongDetailRegisterComponent implements OnInit {
  private readonly sanity = inject(SanityService);

  /** Slug of the event to register for. */
  readonly eventSlug = input.required<string>();

  /** True if the event start date is still in the future. Parent decides. */
  readonly isUpcoming = input<boolean>(true);

  // ---- capacity + state ----
  protected readonly capacity = signal<EventCapacity | null>(null);
  protected readonly capacityLoading = signal(true);
  protected readonly capacityError = signal<string | null>(null);

  protected readonly state = signal<FormState>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  // ---- derived ----
  protected readonly seatsLeft = computed(() => {
    const c = this.capacity();
    if (!c) return 0;
    return Math.max(0, c.maxAttendees - (c.peopleSum || 0));
  });

  protected readonly isFull = computed(() => this.seatsLeft() === 0);

  protected readonly progressPercent = computed(() => {
    const c = this.capacity();
    if (!c || !c.maxAttendees) return 0;
    return Math.min(100, Math.round(((c.peopleSum || 0) / c.maxAttendees) * 100));
  });

  // ---- form ----
  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(0|\+84)\d{9}$/)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    numberOfPeople: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(20)],
    }),
    note: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    this.loadCapacity();
  }

  private loadCapacity(): void {
    this.capacityLoading.set(true);
    this.capacityError.set(null);
    this.sanity.getEventCapacity(this.eventSlug()).subscribe({
      next: (info) => {
        this.capacity.set(info);
        this.capacityLoading.set(false);
      },
      error: () => {
        this.capacityError.set('Không tải được thông tin chỗ ngồi. Vui lòng tải lại trang.');
        this.capacityLoading.set(false);
      },
    });
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: RegistrationPayload = {
      eventSlug: this.eventSlug(),
      fullName: raw.fullName.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim() || undefined,
      numberOfPeople: raw.numberOfPeople,
      note: raw.note.trim() || undefined,
    };

    this.state.set('submitting');
    this.sanity.createRegistration(payload).subscribe({
      next: (res) => {
        this.state.set('success');
        this.successMessage.set(res.message);
        this.form.reset({ numberOfPeople: 1 });
        // Refresh capacity so the displayed seats-left updates immediately.
        this.loadCapacity();
      },
      error: (err: HttpErrorResponse) => {
        this.state.set('error');
        const body = err.error || {};
        if (err.status === 400 && body.errors) {
          this.fieldErrors.set(body.errors);
          this.errorMessage.set('Vui lòng kiểm tra lại các trường bị tô đỏ.');
        } else if (err.status === 409) {
          this.errorMessage.set(body.error || 'Khoá tu đã đầy chỗ.');
          // Refresh capacity to show updated count.
          this.loadCapacity();
        } else if (err.status === 429) {
          this.errorMessage.set(
            body.error || 'Bạn đã gửi quá nhiều đăng ký. Vui lòng chờ một phút.',
          );
        } else if (err.status === 503) {
          this.errorMessage.set(
            'Tính năng đăng ký tạm thời chưa sẵn sàng. Vui lòng liên hệ chùa qua điện thoại.',
          );
        } else {
          this.errorMessage.set(
            body.error || 'Có lỗi xảy ra khi gửi đăng ký. Vui lòng thử lại sau.',
          );
        }
      },
    });
  }

  protected hasFieldError(name: keyof typeof this.form.controls): boolean {
    const ctrl = this.form.controls[name];
    return (
      (ctrl.touched && ctrl.invalid) ||
      Boolean(this.fieldErrors()[name as string])
    );
  }

  protected fieldErrorMessage(name: keyof typeof this.form.controls): string {
    const backendError = this.fieldErrors()[name as string];
    if (backendError) return backendError;
    const ctrl = this.form.controls[name];
    if (!ctrl.touched || ctrl.valid) return '';
    const errors = ctrl.errors || {};
    if (errors['required']) return 'Trường này bắt buộc.';
    if (errors['minlength']) return 'Quá ngắn.';
    if (errors['maxlength']) return 'Quá dài.';
    if (errors['email']) return 'Email không hợp lệ.';
    if (errors['pattern']) return 'Số điện thoại không hợp lệ (vd 0912345678).';
    if (errors['min']) return 'Phải ≥ 1 người.';
    if (errors['max']) return 'Tối đa 20 người / lượt đăng ký.';
    return 'Giá trị không hợp lệ.';
  }

  protected resetSuccessState(): void {
    this.state.set('idle');
    this.successMessage.set(null);
  }
}
