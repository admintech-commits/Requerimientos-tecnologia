import { Resend } from 'resend';
import { config } from '../config.js';

const resend = new Resend(config.resendApiKey);

export async function sendAssignmentEmail(opts: {
  toEmail: string;
  toName: string;
  requirementId: number;
  requirementTitle: string;
  assignedBy: string;
  appUrl: string;
}): Promise<void> {
  if (!config.resendApiKey) {
    console.warn('[mailer] RESEND_API_KEY no configurado — correo omitido');
    return;
  }

  const url = `${opts.appUrl}/requerimientos/${opts.requirementId}`;

  await resend.emails.send({
    from: config.emailFrom,
    to: opts.toEmail,
    subject: `[Req #${opts.requirementId}] Te han asignado un requerimiento`,
    html: `
      <p>Hola <strong>${opts.toName}</strong>,</p>
      <p>
        <strong>${opts.assignedBy}</strong> te ha asignado el siguiente requerimiento:
      </p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:6px 12px;font-weight:600;color:#555">ID</td>
          <td style="padding:6px 12px">#${opts.requirementId}</td>
        </tr>
        <tr style="background:#faf7f2">
          <td style="padding:6px 12px;font-weight:600;color:#555">Título</td>
          <td style="padding:6px 12px">${opts.requirementTitle}</td>
        </tr>
      </table>
      <p>
        <a href="${url}" style="
          display:inline-block;
          padding:10px 20px;
          background:linear-gradient(135deg,#e9b349,#f08a4b);
          color:#fff;
          text-decoration:none;
          border-radius:8px;
          font-weight:600
        ">Ver requerimiento</a>
      </p>
      <p style="color:#999;font-size:12px">
        American Vida &amp; Taxi Imperial — Sistema de Gestión de Requerimientos
      </p>
    `,
  });
}
