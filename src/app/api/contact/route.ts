import { IncomingWebhook } from '@slack/webhook';
import { NextResponse } from 'next/server';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!SLACK_WEBHOOK_URL) {
      return NextResponse.json(
        { message: 'Slack Webhook URLが設定されていません' },
        { status: 500 }
      );
    }

    const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

    await webhook.send({
      text: `新しいお問い合わせがありました\n\nお名前: ${name}\nメールアドレス: ${email}\nお問い合わせ内容:\n${message}`,
    });

    return NextResponse.json({ message: 'お問い合わせを受け付けました' });
  } catch (error) {
    console.error('Slack通知の送信に失敗しました:', error);
    return NextResponse.json(
      { message: 'お問い合わせの送信に失敗しました' },
      { status: 500 }
    );
  }
} 