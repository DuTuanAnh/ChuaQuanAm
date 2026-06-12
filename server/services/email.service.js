/**
 * Email service — sends transactional emails via Resend (https://resend.com).
 *
 * Setup once on Railway:
 *   1. Create account at https://resend.com
 *   2. Add API key → set env RESEND_API_KEY=re_xxxx
 *   3. Optional: verify a domain (chuaquanam.com) so sender can be
 *      "noreply@chuaquanam.com". Without verification, must use
 *      "onboarding@resend.dev" (Resend's default sender).
 *
 * Free tier: 100 emails/day, 3000/month — fits 10 khoá tu × 300 people/year.
 *
 * Fail-soft: if RESEND_API_KEY is not set, sendRegistrationConfirmation
 * resolves silently and logs a warning. Registration itself never fails
 * because of email; users can be contacted by phone as fallback.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const SENDER =
  process.env.RESEND_FROM_EMAIL || 'Chùa Quan Âm <onboarding@resend.dev>';

const formatPeople = (n) =>
  n > 1 ? `${n} người (bao gồm bạn)` : '1 người (bạn)';

/**
 * Email content varies by status. `pending` = "đã ghi nhận, chờ xác nhận",
 * `confirmed` = "chùa đã xác nhận, hẹn ngày giờ", `cancelled` = "không thể
 * sắp xếp được, xin đăng ký khoá sau".
 *
 * Keep brand frame (header, footer, paragraph hồi hướng) identical across
 * statuses so Phật tử recognize it's from the same source.
 */
function buildHtml({ status, fullName, eventTitle, numberOfPeople, dateStr, location }) {
  const body = renderBody(status, { fullName, eventTitle, numberOfPeople, dateStr, location });
  return `<!DOCTYPE html>
<html lang="vi">
  <body style="margin:0;padding:32px 16px;background:#FDF8EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F140C;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:36px 28px;box-shadow:0 8px 30px rgba(61,43,31,0.08);">
      <p style="margin:0;text-align:center;color:#B8860B;font-style:italic;letter-spacing:0.08em;font-size:14px;">— CHÙA QUAN ÂM —</p>
      ${body.heading}
      <p style="margin:0;color:#7A5A45;font-style:italic;text-align:center;font-size:14px;">
        Nam mô A Di Đà Phật
      </p>

      <hr style="border:none;border-top:1px solid #D9CCB6;margin:28px 0;" />

      <p style="margin:0 0 16px;line-height:1.6;">
        Kính gửi <strong>${escapeHtml(fullName)}</strong>,
      </p>
      ${body.lead}

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;width:100%;border-collapse:collapse;background:#FDF8EF;border-radius:12px;overflow:hidden;">
        ${dateStr ? row('Thời gian', dateStr) : ''}
        ${location ? row('Địa điểm', location) : ''}
        ${row('Số người', formatPeople(numberOfPeople))}
      </table>

      ${body.cta}

      <p style="margin:18px 0;line-height:1.7;color:#5A4030;font-size:14px;">
        Mọi thắc mắc xin liên hệ chùa qua số <strong>0984 148 802</strong>.
      </p>

      <hr style="border:none;border-top:1px solid #D9CCB6;margin:28px 0;" />

      <p style="margin:0;text-align:center;color:#7A5A45;font-style:italic;font-size:13px;line-height:1.6;">
        Nguyện đem công đức này<br/>
        Hồi hướng khắp tất cả<br/>
        Đệ tử và chúng sinh<br/>
        Đều trọn thành Phật đạo.
      </p>

      <p style="margin:24px 0 0;text-align:center;color:#8B7B6A;font-size:12px;line-height:1.5;">
        Chùa Quan Âm — Mỹ Đông, Đông Hải, Khánh Hoà<br/>
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </body>
</html>`;
}

function renderBody(status, { eventTitle, numberOfPeople }) {
  const eventBold = `<strong>${escapeHtml(eventTitle || 'Khoá tu')}</strong>`;
  const peopleBold = `<strong>${formatPeople(numberOfPeople)}</strong>`;

  if (status === 'confirmed') {
    return {
      heading: `<h1 style="margin:18px 0 8px;font-family:Georgia,serif;color:#3D2B1F;font-size:26px;font-weight:600;text-align:center;">
        ✓ Đã xác nhận tham dự
      </h1>`,
      lead: `<p style="margin:0 0 16px;line-height:1.7;">
        Ban quản trị chùa Quan Âm xin trân trọng <strong>xác nhận</strong> đăng ký của
        quý Phật tử tham dự ${eventBold} cho ${peopleBold}.
      </p>
      <p style="margin:0 0 16px;line-height:1.7;">
        Kính mong quý vị về chùa đúng giờ. Đến nơi xin báo họ tên với
        ban tiếp lễ để được hướng dẫn.
      </p>`,
      cta: `<p style="margin:18px 0;line-height:1.7;background:#FFF7E5;padding:14px 18px;border-radius:10px;border-left:4px solid #B8860B;">
        <strong>Lưu ý chuẩn bị</strong>: Y phục Phật tử (áo lam/nâu) — chùa cho mượn nếu chưa có. Bình nước cá nhân + tâm hoan hỷ.
      </p>`,
    };
  }

  if (status === 'cancelled') {
    return {
      heading: `<h1 style="margin:18px 0 8px;font-family:Georgia,serif;color:#3D2B1F;font-size:26px;font-weight:600;text-align:center;">
        Đăng ký không thể sắp xếp
      </h1>`,
      lead: `<p style="margin:0 0 16px;line-height:1.7;">
        Chùa Quan Âm xin trân trọng cảm tạ quý Phật tử đã có lòng đăng ký
        tham dự ${eventBold}.
      </p>
      <p style="margin:0 0 16px;line-height:1.7;">
        Rất tiếc do số lượng đăng ký đã vượt sức chứa của chùa, ban quản trị
        chưa thể sắp xếp lần này. Kính mong quý vị hoan hỷ và đăng ký
        các khoá tu sắp tới.
      </p>`,
      cta: `<p style="margin:18px 0;text-align:center;">
        <a href="https://chua-quan-am.vercel.app/hoat-dong"
           style="display:inline-block;background:#3D2B1F;color:#FDF8EF;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px;">
          Xem các khoá tu sắp tới
        </a>
      </p>`,
    };
  }

  // pending (default — used by initial signup)
  return {
    heading: `<h1 style="margin:18px 0 8px;font-family:Georgia,serif;color:#3D2B1F;font-size:26px;font-weight:600;text-align:center;">
      Đã ghi nhận đăng ký
    </h1>`,
    lead: `<p style="margin:0 0 16px;line-height:1.7;">
      Chùa Quan Âm xin cảm tạ và đã ghi nhận đăng ký của quý Phật tử
      tham dự ${eventBold} cho ${peopleBold}.
    </p>`,
    cta: `<p style="margin:18px 0;line-height:1.7;">
      Ban quản trị chùa sẽ xem xét và gửi email xác nhận chính thức
      trong 1–2 ngày tới.
    </p>`,
  };
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 18px;color:#7A5A45;font-size:13px;width:120px;border-bottom:1px solid #F2E6CC;">${escapeHtml(label)}</td>
    <td style="padding:10px 18px;color:#1F140C;font-size:14px;border-bottom:1px solid #F2E6CC;">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SUBJECT_BY_STATUS = {
  pending: 'Đã ghi nhận đăng ký',
  confirmed: '✓ Đã xác nhận tham dự',
  cancelled: 'Cập nhật đăng ký khoá tu',
};

/**
 * Send a status email to the Phật tử. Used for:
 * - First signup (status='pending') — triggered from POST /api/registrations
 * - Approve (status='confirmed') — triggered from Sanity webhook on status change
 * - Cancel (status='cancelled') — triggered from Sanity webhook on status change
 *
 * Inputs come from validated sources — never echo unsanitized input into the
 * HTML (escape on every interpolation in `buildHtml`).
 *
 * Fail-soft: if RESEND_API_KEY is missing, logs a warning and resolves.
 *
 * @param {object} args
 * @param {'pending'|'confirmed'|'cancelled'} args.status
 * @param {string} args.to               Recipient email
 * @param {string} args.fullName
 * @param {string} args.eventTitle
 * @param {number} args.numberOfPeople
 * @param {string} [args.dateStr]        Pre-formatted vi-VN datetime for the body
 * @param {string} [args.location]
 * @returns {Promise<void>}
 */
export async function sendRegistrationStatusEmail({
  status,
  to,
  fullName,
  eventTitle,
  numberOfPeople,
  dateStr,
  location,
}) {
  if (!isEmailConfigured()) {
    console.warn(
      `[${new Date().toISOString()}] [EMAIL] RESEND_API_KEY not set — skipping ${status} email to ${to}`,
    );
    return;
  }

  const subject = `${SUBJECT_BY_STATUS[status] || 'Cập nhật đăng ký'} — ${eventTitle || 'Khoá tu'}`;
  const html = buildHtml({
    status,
    fullName,
    eventTitle: eventTitle || 'Khoá tu',
    numberOfPeople,
    dateStr,
    location,
  });

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: SENDER, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  console.log(
    `[${new Date().toISOString()}] [EMAIL] sent ${status} email to ${to}`,
  );
}

/**
 * Backwards-compat alias — initial signup always uses 'pending' status.
 */
export function sendRegistrationConfirmation(args) {
  return sendRegistrationStatusEmail({ ...args, status: 'pending' });
}
