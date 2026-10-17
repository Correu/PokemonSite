import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'pokemon-site-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme$ = new BehaviorSubject<AppTheme>(this.loadStored());

  constructor() {
    this.apply(this.theme$.value);
  }

  get theme(): AppTheme {
    return this.theme$.value;
  }

  setTheme(theme: AppTheme): void {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
    this.theme$.next(theme);
  }

  private apply(theme: AppTheme): void {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }

  private loadStored(): AppTheme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
}
