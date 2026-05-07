import { Component, signal } from '@angular/core';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [],
  templateUrl: './chatbox.component.html',
  styleUrl: './chatbox.component.scss',
})
export class ChatboxComponent {
  protected readonly open = signal(false);
  protected readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Mô Phật. Quý vị có thắc mắc gì về chùa hay giáo lý xin để lại câu hỏi, chúng tôi sẽ chia sẻ trong chánh niệm.',
      ts: Date.now(),
    },
  ]);

  protected toggle() {
    this.open.update((v) => !v);
  }

  protected send(input: HTMLInputElement) {
    const text = input.value.trim();
    if (!text) return;
    this.messages.update((list) => [...list, { role: 'user', text, ts: Date.now() }]);
    input.value = '';
    // TODO: wire to ClaudeService through NgRx Effect (chat.effects.ts)
  }
}
