import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';

interface HistoryBlock {
  eyebrow: string;
  title: string;
  body: string;
  tone: 'sunrise' | 'midday' | 'evening';
  motif: 'mountain' | 'temple' | 'lotus';
}

interface GalleryItem {
  id: string;
  caption: string;
  tone: 'cream' | 'saffron' | 'lotus' | 'jade' | 'brown' | 'sunset';
  motif: 'lotus' | 'temple' | 'bell' | 'cloud' | 'tree' | 'circle';
}

@Component({
  selector: 'app-gioi-thieu',
  standalone: true,
  imports: [RouterLink, GalleriaModule],
  templateUrl: './gioi-thieu.component.html',
  styleUrl: './gioi-thieu.component.scss',
})
export class GioiThieuComponent {
  /** 3 alternating image/text blocks. Body copy is intentionally generic until
   *  the temple confirms specifics — see CLAUDE.md §1.1 + §8 placeholder rule. */
  protected readonly historyBlocks: HistoryBlock[] = [
    {
      eyebrow: 'Khởi nguồn',
      title: 'Một mái chùa giữa lòng quê hương',
      body:
        'Chùa Quan Âm là tự viện Phật giáo Bắc Tông toạ lạc tại Mỹ Đông, Đông Hải, ' +
        'Ninh Thuận — nơi Phật tử bốn phương về nương tựa Tam Bảo, lấy hạnh nguyện ' +
        'của Đức Bồ Tát Quán Thế Âm làm chỗ quay về của tâm. ' +
        '{{TODO: năm thành lập, vị khai sơn, hoàn cảnh hình thành — chờ thầy duyệt.}}',
      tone: 'sunrise',
      motif: 'mountain',
    },
    {
      eyebrow: 'Phát triển',
      title: 'Gìn giữ truyền thống Đại thừa',
      body:
        'Trải qua nhiều thế hệ, chùa giữ gìn nếp tu học của tông môn Bắc Tông — ' +
        'tụng kinh Pháp Hoa, niệm danh hiệu Đức Phật A Di Đà, hành trì pháp môn ' +
        'Tịnh Độ song song với thiền tập. Chùa cũng là nơi tổ chức các đại lễ ' +
        'Phật Đản, Vu Lan, Vía Quán Âm cho cộng đồng Phật tử trong vùng. ' +
        '{{TODO: các giai đoạn tu sửa / mở rộng — chờ cập nhật.}}',
      tone: 'midday',
      motif: 'temple',
    },
    {
      eyebrow: 'Hôm nay',
      title: 'Chốn về cho người con Phật',
      body:
        'Hiện nay, chùa Quan Âm tiếp tục mở rộng các hoạt động giáo lý, khoá tu, ' +
        'sinh hoạt cộng đồng và từ thiện. Mỗi sớm chiều, hồng chung ngân vọng, ' +
        'lời kinh hoà cùng khói trầm — đại chúng tề tựu hành lễ, nuôi dưỡng tâm từ ' +
        'và trí tuệ. Chùa luôn rộng mở cho khách thập phương về tham học.',
      tone: 'evening',
      motif: 'lotus',
    },
  ];

  /** PrimeNG Galleria items — placeholder cards until real photos arrive. */
  protected readonly galleryItems: GalleryItem[] = [
    { id: 'g1', caption: 'Đại hùng bảo điện',           tone: 'saffron', motif: 'temple' },
    { id: 'g2', caption: 'Tôn tượng Bồ Tát Quán Thế Âm', tone: 'lotus',   motif: 'lotus'  },
    { id: 'g3', caption: 'Vườn chùa',                    tone: 'jade',    motif: 'tree'   },
    { id: 'g4', caption: 'Cổng tam quan',                tone: 'sunset',  motif: 'temple' },
    { id: 'g5', caption: 'Hồng chung & trống bát-nhã',   tone: 'brown',   motif: 'bell'   },
    { id: 'g6', caption: 'Sân thiền',                    tone: 'cream',   motif: 'circle' },
  ];

  protected readonly galleriaResponsive = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px',  numVisible: 4 },
    { breakpoint: '560px',  numVisible: 3 },
  ];
}
