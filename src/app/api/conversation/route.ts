import { DEFAULT_CONFIG } from '@/config/llm';
import { authOptions } from '@/lib/auth.js';
import type { ConversationState, Message } from '@/lib/langchain/conversation-graph';
import {
  createConversationGraph,
  createStreamingConversationGraph,
} from '@/lib/langchain/conversation-graph';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * 会話APIのPOSTハンドラ
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: Message[] = body.messages;
    const stream = body.stream === true;
    const model = body.model || DEFAULT_CONFIG.model;

    // セッション情報を取得し、ユーザー情報を設定
    const session = await getServerSession(authOptions);
    const userId = session?.uid || body.userId || 'anonymous';
    const userEmail = session?.email || body.userEmail || 'anonymous';
    const conversationId = body.conversationId;

    console.log('ユーザー情報:', userId, userEmail, conversationId);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'メッセージは必須です' }, { status: 400 });
    }

    // メッセージの内容を検証
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'メッセージには role と content が必要です' },
          { status: 400 }
        );
      }

      // 画像URLの検証（配列形式のコンテンツの場合）
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'image_url' && (!item.image_url || !item.image_url.url)) {
            return NextResponse.json({ error: '画像URLが不正です' }, { status: 400 });
          }
        }
      }
    }

    // 初期状態を設定
    const initialState: ConversationState = {
      messages,
      modelConfig: {
        model,
        temperature: DEFAULT_CONFIG.temperature,
        maxTokens: DEFAULT_CONFIG.maxTokens,
        topP: DEFAULT_CONFIG.topP,
      },
      metadata: {
        userId,
        userEmail,
        conversationId,
      },
    };

    // ストリーミングモードの場合
    if (stream) {
      const encoder = new TextEncoder();
      const streamingGraph = await createStreamingConversationGraph();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // ストリーミンググラフを実行
            const stream = await streamingGraph.invoke(initialState);

            let lastContent = '';

            for await (const chunk of stream) {
              if (chunk.messages && chunk.messages.length > 0) {
                const lastMessage = chunk.messages[chunk.messages.length - 1];
                if (lastMessage.role === 'assistant') {
                  // 前回との差分を計算
                  const newContent = lastMessage.content;

                  // クライアント側の実装に合わせて、完全な内容を送信
                  const encodedChunk = encoder.encode(
                    `${JSON.stringify({
                      type: 'chunk',
                      content: newContent,
                    })}\n`
                  );
                  controller.enqueue(encodedChunk);

                  lastContent = newContent as string;
                }
              }
            }

            // 完了メッセージを送信
            const finalMessage = {
              role: 'assistant',
              content: lastContent,
            };

            const encodedFinal = encoder.encode(
              `${JSON.stringify({
                type: 'done',
                message: finalMessage,
              })}\n`
            );
            controller.enqueue(encodedFinal);
            controller.close();
          } catch (error) {
            console.error('ストリーミングエラー:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // 通常モード
    const graph = createConversationGraph();
    const result = await graph.invoke(initialState);

    return NextResponse.json({
      messages: result.messages,
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
