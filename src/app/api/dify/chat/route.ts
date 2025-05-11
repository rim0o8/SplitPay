import { type DifyChatRequest, sendDifyChatMessage } from '@/lib/dify';
import { getDifyAppById } from '@/lib/dify/apps';

/**
 * POST /api/dify/chat
 * Proxy to Dify /v1/chat-messages endpoint
 */
export async function POST(request: Request) {
  console.log('==== API ROUTE: /api/dify/chat ====');
  console.log('[API] Dify Chat API called');

  return handlePOST(request);
}

/**
 * 実際のPOST処理を行う関数（明示的な命名によりNext.jsのルート認識を強化）
 */
async function handlePOST(request: Request) {
  console.log('[API] handlePOST started');

  // SSEレスポンスヘッダー
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };

  try {
    // リクエストボディを解析
    const body = await request.json();
    console.log('[INFO] API Request received:', {
      conversationId: body.conversationId || 'new',
      modelId: body.model,
      messageCount: body?.messages?.length || 0,
      appId: body.appId,
    });

    // アプリIDが指定されている場合、そのアプリ用のAPIキーを取得
    let apiKey = undefined;
    if (body.appId) {
      try {
        const app = await getDifyAppById(body.appId);
        if (app?.apiKey) {
          console.log(`[API] Using API key for app: ${app.name}`);
          apiKey = app.apiKey;
        }
      } catch (error) {
        console.error(`[API] Failed to get API key for app ID ${body.appId}:`, error);
      }
    }

    // Dify APIリクエストの構築
    const difyRequest: DifyChatRequest = {
      messages: body.messages || [],
      stream: true,
      model: body.model,
      conversationId: body.conversationId,
      userId: body.userId,
      userEmail: body.userEmail,
      apiKey: apiKey, // アプリ固有のAPIキーを使用
    };

    // Dify APIを呼び出し
    const difyResponse = await sendDifyChatMessage(difyRequest);

    if (!difyResponse.body) {
      throw new Error('Dify APIからのレスポンスボディがありません');
    }

    // レスポンスボディを変数に保存（TypeScriptのnull判定のため）
    const responseBody = difyResponse.body;

    // サーバーサイドでストリーミングレスポンスを処理して転送
    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    // 非同期処理でSSEストリームを処理
    (async () => {
      try {
        // 初期化イベントを送信
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'init', message: 'Connection established' })}\n\n`
          )
        );

        // Dify APIからのストリームを読み取り
        const reader = responseBody.getReader();
        const decoder = new TextDecoder();
        let buffer = ''; // 不完全な行を保持するバッファ
        let conversationId = body.conversationId;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[API] Dify stream complete');
            break;
          }

          // 受信したチャンクをデコード
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // バッファを行ごとに処理
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 最後の行は不完全な可能性があるのでバッファに残す

          for (const line of lines) {
            if (line.trim() === '') continue;

            // SSEフォーマットの行を処理（data: プレフィックスがある場合）
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.substring(6).trim();

                // JSONオブジェクトが{...}形式であることを確認
                if (jsonData.startsWith('{') && jsonData.endsWith('}')) {
                  const data = JSON.parse(jsonData);
                  console.log('[API] Parsed Dify event:', data.event || 'unknown');

                  // 会話IDを抽出（Difyのレスポンスから）
                  if (!conversationId && data.conversation_id) {
                    conversationId = data.conversation_id;
                    console.log('[API] New conversation ID:', conversationId);
                  }

                  // イベントタイプに基づいて処理
                  if (data.event === 'message' || data.event === 'message_chunk') {
                    // テキストコンテンツを取得
                    const content = data.answer || data.content || data.message || '';

                    if (content) {
                      // クライアントに標準化されたフォーマットで送信
                      const chunkEvent = JSON.stringify({
                        type: 'chunk',
                        content,
                        conversation_id: conversationId,
                      });
                      await writer.write(encoder.encode(`data: ${chunkEvent}\n\n`));
                    }
                  } else if (data.event === 'message_end') {
                    // 会話終了イベント
                    const doneEvent = JSON.stringify({
                      type: 'done',
                      message: {
                        role: 'assistant',
                        content: data.answer || data.content || data.message || '',
                      },
                      conversation_id: conversationId,
                    });
                    await writer.write(encoder.encode(`data: ${doneEvent}\n\n`));
                  } else if (data.event === 'tts_message') {
                    // TTS音声データ
                    const ttsEvent = JSON.stringify({
                      type: 'tts',
                      audio: data.audio,
                      conversation_id: conversationId,
                    });
                    await writer.write(encoder.encode(`data: ${ttsEvent}\n\n`));
                  } else if (data.event === 'error') {
                    // エラーイベント
                    const errorEvent = JSON.stringify({
                      type: 'error',
                      error: data.message || 'Dify API error',
                    });
                    await writer.write(encoder.encode(`data: ${errorEvent}\n\n`));
                  }
                } else {
                  // JSONではないデータが来た場合
                  console.log('[API] Non-JSON data received:', jsonData.substring(0, 50));
                }
              } catch (e) {
                console.error('[API] Failed to parse SSE data:', {
                  line: line.substring(0, 100),
                  error: e instanceof Error ? e.message : String(e),
                });
              }
            }
          }
        }

        // ストリームを完了
        await writer.close();
      } catch (e) {
        console.error('[API] Error processing Dify stream:', e);

        // エラーイベントを送信
        const errorEvent = JSON.stringify({
          type: 'error',
          error: e instanceof Error ? e.message : String(e),
        });

        try {
          await writer.write(encoder.encode(`data: ${errorEvent}\n\n`));
          await writer.close();
        } catch (err) {
          console.error('[API] Error sending error event:', err);
        }
      }
    })();

    // 変換されたストリームをレスポンスとして返す
    return new Response(transformStream.readable, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[ERROR] API processing error:', error);

    // エラーレスポンスをSSE形式で返す
    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    // エラーメッセージをクライアントに送信
    const errorMessage = JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    });

    await writer.write(encoder.encode(`data: ${errorMessage}\n\n`));
    await writer.close();

    return new Response(transformStream.readable, {
      headers: responseHeaders,
    });
  }
}
