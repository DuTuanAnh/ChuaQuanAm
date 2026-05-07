import { Component, computed, inject, input, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { YouTubePlayer } from '@angular/youtube-player';

import { Dharma } from '../../shared/models/dharma.model';
import {
  DharmaActions,
  selectLoading,
  selectRelatedVideos,
  selectVideoBySlug,
  selectVideos,
} from './store';

type PlayerKind = 'youtube' | 'upload' | 'audio' | 'none';

@Component({
  selector: 'app-phap-thoai-detail',
  standalone: true,
  imports: [RouterLink, YouTubePlayer],
  templateUrl: './phap-thoai-detail.component.html',
  styleUrl: './phap-thoai-detail.component.scss',
})
export class PhapThoaiDetailComponent implements OnInit {
  private readonly store = inject(Store);

  /** Bound from route param via withComponentInputBinding(). */
  readonly slug = input.required<string>();

  private readonly allVideos = toSignal(this.store.select(selectVideos), {
    initialValue: [] as Dharma[],
  });

  protected readonly loading = toSignal(this.store.select(selectLoading), {
    initialValue: false,
  });

  protected readonly video = computed<Dharma | undefined>(() => {
    // Re-select via factory for memoization across slug changes.
    return this.allVideos().find((v) => v.slug.current === this.slug());
  });

  protected readonly playerKind = computed<PlayerKind>(() => {
    const v = this.video();
    if (!v) return 'none';
    if (v.youtubeId) return 'youtube';
    if (v.videoUrl) return 'upload';
    if (v.audioUrl) return 'audio';
    return 'none';
  });

  protected readonly related = computed<Dharma[]>(() => {
    const v = this.video();
    if (!v) return [];
    // Use factory selector synchronously by replicating its logic — keeps signals reactive.
    const others = this.allVideos().filter((x) => x._id !== v._id);
    const sameSpeaker = v.speaker ? others.filter((x) => x.speaker === v.speaker) : [];
    const sameTopic = v.tags?.length
      ? others.filter((x) => x.tags?.some((t) => v.tags!.includes(t)))
      : [];
    const ordered = [
      ...sameSpeaker,
      ...sameTopic.filter((x) => !sameSpeaker.includes(x)),
      ...others.filter((x) => !sameSpeaker.includes(x) && !sameTopic.includes(x)),
    ];
    return ordered.slice(0, 3);
  });

  ngOnInit() {
    // Idempotent — safe to dispatch even if videos already loaded.
    if (this.allVideos().length === 0) {
      this.store.dispatch(DharmaActions.loadVideos());
    }
  }

  // ---- helpers ----
  protected formatDuration(sec?: number): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }

  protected videoThumb(v: Dharma): string | null {
    const sanityUrl = (v.thumbnail as { asset?: { url?: string } } | undefined)
      ?.asset?.url;
    if (sanityUrl) return sanityUrl;
    if (v.youtubeId) return `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
    return null;
  }
}
