import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';


function contrasenasIguales(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const repetir = grupo.get('repetir')?.value;
  return password === repetir ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  cargando = signal(false);

  form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
      repetir: ['', [Validators.required]],
    },
    { validators: contrasenasIguales },
  );

  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

 
  get noCoinciden(): boolean {
    return this.form.hasError('noCoinciden') && !!this.form.get('repetir')?.touched;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.cargando.set(true);

    const { nombre, email, password } = this.form.getRawValue();
    this.auth.registro({ nombre, email, password }).subscribe({
      
      next: () =>
        this.auth.login(email, password).subscribe({
          next: () => this.router.navigate(['/grupos']),
          error: () => this.router.navigate(['/login']),
        }),
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err.status === 409
            ? 'Ya existe una cuenta con ese email'
            : err.status === 422
              ? 'Revisa los datos: alguno no es válido'
              : 'No se pudo conectar con el servidor. ¿Está encendido el backend?',
        );
      },
    });
  }
}