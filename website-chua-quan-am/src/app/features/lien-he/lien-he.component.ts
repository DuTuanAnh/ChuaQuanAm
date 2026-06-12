import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-lien-he',
  standalone: true,
  imports: [],
  templateUrl: './lien-he.component.html',
  styleUrl: './lien-he.component.scss',
})
export class LienHeComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Google Maps embed pointing to Mỹ Đông, Đông Hải, Khánh Hoà
   * (the temple's confirmed address — see CLAUDE.md §1.1).
   * Uses the public search-query embed format — no API key required.
   */
  protected readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.google.com/maps?q=' +
      encodeURIComponent('Chùa Quan Âm, Mỹ Đông, Đông Hải, Khánh Hoà') +
      '&t=&z=14&ie=UTF8&iwloc=&output=embed',
  );
}
