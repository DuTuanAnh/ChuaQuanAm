import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly mobileOpen = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Hoạt động', path: '/hoat-dong' },
    { label: 'Pháp thoại', path: '/phap-thoai' },
    { label: 'Thư viện ảnh', path: '/thu-vien-anh' },
    { label: 'Giới thiệu', path: '/gioi-thieu' },
    { label: 'Liên hệ', path: '/lien-he' },
  ];

  protected toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }

  protected closeMobile() {
    this.mobileOpen.set(false);
  }
}
