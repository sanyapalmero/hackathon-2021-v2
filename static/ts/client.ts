// Пример использования в коде:
//
// Регистрация пользователя по 4-значному номеру number:
//
// let client = CallingClient.get();
// await client.register(number);
//
//
// Звонок по номеру otherNumber. Promise резволвится, когда началось ожидание
// ответа абонента. Принятие или отклонение звонка с его стороны случится позже
// (см. обработку событий)
//
// let client = CallingClient.get();
// await client.call(otherNumber);
//
//
// Обработка событий, например входящий звонок или отклонение/завершение/принятие звонка.
//
// let client = CallingClient.get();
// client.addEventHandler(event => {
//   if (event.type === "incomingCall") {
//     // Входящий звонок, отображаем пользователю UI.
//     // См. данные в event.call.
//   } else if (event.type === "callStateChange") {
//     // Изменился статус звонка, входящего или исходящего
//     // См. данные в event.call.
//     if (event.call.state === "declined") {
//       // Звонок отклонен. Если входящий - пользователем, если исходящий - другим абонентом.
//     } else if (event.call.state === "accepted") {
//       // Звонок принят, соединение установилось
//     } else if (event.call.state === "finished") {
//       // Звонок завершен.
//     }
//   }
// });
//
//
// Принятие или отклонение входящего звонка
//
// let client = CallingClient.get();
// await client.acceptCall();
// await client.refuseCall();
//
//
// Включение/выключение звука, для привязки к кнопке Talk:
//
// let client = CallingClient.get();
// // Исходящий звук (т.е. микрофон)
// client.setOutMuted(false);
// client.setOutMuted(true);
// // Входящий звук
// client.setInMuted(false);
// client.setInMuted(true);
//
//
// Обработка ошибок: Методы, выполняющие любые действия, могут выбросить ошибку.
// Важно учесть это в коде, чтобы сообщение выводилось пользователю и интерфейс
// не блокировался в анимации загрузки или каком-то промежуточном состоянии.
//
// Входящий звонок можно для удобства спровоцировать, вызвав в консоли браузера:
// callme();

import { Janus } from "janus-gateway";
import { Notyf } from 'notyf';

// Create an instance of Notyf
const notyf = new Notyf();

// weDeclinedIncoming - неначатый звонок отклонили мы.
// theyDeclinedIncoming - неначатый звонок отклонил абонент на другом конце.
// busy - абонент занят.
// error - не удалось начать звонок. Скорее всего, ошибка в номере.
// other - неизвестная причина.
export type DeclineReason = 'weDeclinedIncoming' | 'theyDeclinedIncoming' | 'busy' | 'error' | 'other';

export interface CallStateChangeEvent {
  type: "callStateChange",
  call: Call,
  // Задаются при call.state === 'declined'
  declineReason?: DeclineReason,
  declineMessage?: string,
}

// unanswered - соединение между абонентами еще не установлено.
// declined - звонок отклонен до начала.
// accepted - звонок принят, соединение установлено.
// finished - завершен начатый звонок.
export type CallState = 'unanswered' | 'declined' | 'accepted' | 'finished';

export interface Call {
  type: "incoming" | "outgoing",
  fromNumber: string,
  toNumber: string,
  state: CallState,
}

export interface IncomingCallEvent {
  type: "incomingCall",
  call: Call,
}

export type ClientEvent = CallStateChangeEvent | IncomingCallEvent;

type ClientEventHandler = (event: ClientEvent) => void;


export default class CallingClient {
  static SERVER_URLS = [
    // "wss://videos-webrtc.dev.avalab.io/websocket",
    "https://videos-webrtc.dev.avalab.io/restapi",
  ];
  static DEBUG_JANUS = false;

  private static singleton: CallingClient | null = null;

  number: string | undefined;
  activeCall: Call | null = null;
  private activeIncomingCallJanusEvent: JanusPluginEvent | null = null;

  isOutMuted: boolean = true;
  isInMuted: boolean = false;

  private eventHandlers: ClientEventHandler[] = [];

  private session: any = null;
  private pluginHandle: any = null;
  private hasRegistered: boolean = false;

  static get(): CallingClient {
    if (!this.singleton) {
      this.singleton = new CallingClient();
    }
    return this.singleton;
  }

  private constructor() { }

  async register(number: string): Promise<void> {
    this.number = number;

    await this.initJanus();
    this.assertBrowserSupport();
    await this.initSession();
    await this.initPlugin();
    await this.registerInPlugin();
    this.hasRegistered = true;
  }

  get clientId(): string | undefined {
    if (this.number) {
      return numberToClientId(this.number);
    } else {
      return undefined;
    }
  }

  async call(number: string): Promise<void> {
    this.assertHasRegistered();

    return new Promise<void>((resolve, reject) => {
      this.pluginHandle.createOffer({
        media: { video: false, audio: true },
        success: async (jsep: any) => {
          // Задаем activeCall здесь, а не во вложенном success ниже,
          // потому что Janus может прислать событие hangup по этому звонку
          // до того как send выполнится. А нам важно иметь activeCall на момент приема hangup.
          this.activeCall = {
            type: "outgoing",
            fromNumber: this.number!,
            toNumber: number,
            state: "unanswered",
          };
          this.emitEvent({
            type: "callStateChange",
            call: this.activeCall,
          });

          Janus.debug("Got SDP!", jsep);
          var body = { request: "call", username: numberToClientId(number) };
          this.pluginHandle.send({
            message: body,
            jsep: jsep,
            success: () => {
              resolve();
            },
            error: (error: any) => {
              reject(error);
            }
          });
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  addEventHandler(handler: ClientEventHandler) {
    this.eventHandlers.push(handler);
  }

  async acceptCall() {
    this.assertHasRegistered();

    if (!this.activeCall || this.activeCall.type != "incoming" || this.activeCall.state != "unanswered") {
      throw new Error("Нет входящего звонка");
    }

    if (!this.activeIncomingCallJanusEvent) {
      throw new Error("Нет входящего звонка (activeIncomingCallJanusEvent)");
    }

    return new Promise<void>((resolve, reject) => {
      this.pluginHandle.createAnswer({
        jsep: this.activeIncomingCallJanusEvent!.jsep,
        media: { video: false, audio: true },
        success: (jsep: any) => {
          Janus.debug("Got SDP!", jsep);
          var body = { request: "accept" };
          this.pluginHandle.send({
            message: body,
            jsep: jsep,
            success: () => {
              resolve();
            },
            error: (error: any) => {
              reject(error);
            }
          });
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  async hangupCall() {
    this.assertHasRegistered();

    if (!this.activeCall) {
      notyf.error('Нет активного звонка')
      throw new Error("Нет активного звонка");
    }

    return new Promise<void>((resolve, reject) => {
      this.pluginHandle.send({
        message: { request: "hangup" },
        success: () => {
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
      this.pluginHandle.hangup();
    });
  }

  async setOutMuted(muted: boolean) {
    this.assertHasRegistered();

    return new Promise<void>((resolve, reject) => {
      this.pluginHandle.send({
        message: { request: "set", audio: !muted },
        success: () => {
          this.isOutMuted = muted;
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }

  async setInMuted(muted: boolean) {
    this.isInMuted = muted;

    let audioElement = this.getAudioElement();
    audioElement.volume = muted ? 0.0 : 1.0;
  }

  private async initJanus() {
    return new Promise<void>(resolve => {
      Janus.init({
        debug: CallingClient.DEBUG_JANUS,
        callback: () => {
          resolve();
        },
      });
    });
  }

  private assertBrowserSupport() {
    if (!Janus.isWebrtcSupported()) {
      notyf.error('Этот браузер устарел и не поддерживает данный проект.')
      alert("Этот браузер устарел и не поддерживает данный проект.");
      throw new Error("WebRTC is not supported.");
    }
  }

  private async initSession() {
    return new Promise<void>((resolve, reject) => {
      this.session = new Janus({
        server: CallingClient.SERVER_URLS,
        success: () => {
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }

  private async initPlugin() {
    return new Promise<void>((resolve, reject) => {
      this.session.attach({
        plugin: "janus.plugin.videocall",
        opaqueId: this.clientId,
        success: (pluginHandle: any) => {
          this.pluginHandle = pluginHandle;
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
        iceState: (state: any) => {
          Janus.log("ICE state changed to " + state);
        },
        mediaState: (medium: any, on: any) => {
          Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
        },
        webrtcState: (on: any) => {
          Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        },
        onmessage: (msg: any, jsep: any) => {
          Janus.debug(" ::: Got a message :::", msg);

          if (msg["result"]) {
            let result = msg["result"];
            if (result["event"]) {
              this.handlePluginEvent({
                type: result["event"],
                msg,
                jsep,
              });
            }
          }

          if (msg["error"]) {
            this.handlePluginError({
              code: msg["error_code"] ? msg["error_code"] : undefined,
              text: msg["error"] ? msg["error"] : undefined,
            });
          }
        },
        onlocalstream: (stream: any) => {
          Janus.debug(" ::: Got a local stream :::", stream);
          // Пока пусто, но этот коллбэк может быть полезен для извлечения мощности сигнала
        },
        onremotestream: (stream: any) => {
          Janus.debug(" ::: Got a remote stream :::", stream);

          let audioElement = this.getAudioElement();
          Janus.attachMediaStream(audioElement, stream);
        },
        oncleanup: () => {
          Janus.log(" ::: Got a cleanup notification :::");
        },
      });
    });
  }

  private handlePluginEvent(event: JanusPluginEvent) {
    if (event.type === "incomingcall") {
      let fromClientId = event.msg.result.username;
      this.activeIncomingCallJanusEvent = event;
      this.activeCall = {
        type: "incoming",
        state: "unanswered",
        fromNumber: clientIdToNumber(fromClientId),
        toNumber: this.number!,
      };
      this.emitEvent({
        type: "incomingCall",
        call: this.activeCall!,
      });
      this.emitEvent({
        type: "callStateChange",
        call: this.activeCall!,
      });
    } else if (event.type === "accepted") {
      if (event.jsep) this.pluginHandle.handleRemoteJsep({ jsep: event.jsep });

      this.setOutMuted(true);
      this.setInMuted(false);

      this.activeIncomingCallJanusEvent = null;
      if (this.activeCall) {
        this.activeCall.state = "accepted";
        this.emitEvent({
          type: "callStateChange",
          call: this.activeCall,
        });
      }
    } else if (event.type === "update") {
      if (event.jsep) {
        if (event.jsep.type === "answer") {
          this.pluginHandle.handleRemoteJsep({ jsep: event.jsep });
        } else {
          this.pluginHandle.createAnswer(
            {
              jsep: event.jsep,
              media: { video: false, audio: true },
              success: (jsep: any) => {
                Janus.debug("Got SDP!", jsep);
                var body = { request: "set" };
                this.pluginHandle.send({ message: body, jsep: jsep });
              },
              error: (error: any) => {
                throw error;
              }
            });
        }
      }
    } else if (event.type === "hangup") {
      this.activeIncomingCallJanusEvent = null;
      if (this.activeCall) {
        let hungUpCall = this.activeCall;
        this.activeCall = null;

        let reason: DeclineReason = 'other';
        let message: string = "Звонок отклонен";
        if (event.msg.result.reason === "User busy") {
          notyf.error('Абонент занят')
          reason = 'busy';
          message = "Абонент занят";
        } else if (event.msg.result.reason === "We did the hangup") {
          notyf.error('Абонент отклонил звонок')
          reason = 'theyDeclinedIncoming';
          message = "Абонент отклонил звонок";
        } else if (event.msg.result.reason === "Explicit hangup") {
          reason = 'weDeclinedIncoming';
          message = "Вы отклонили звонок";
        }

        if (hungUpCall.state === "unanswered") {
          hungUpCall.state = "declined";
          this.emitEvent({
            type: "callStateChange",
            call: hungUpCall,
            declineReason: reason,
            declineMessage: message,
          });
        } else {
          hungUpCall.state = "finished";
          this.emitEvent({
            type: "callStateChange",
            call: hungUpCall,
          });
        }
      }

      this.pluginHandle.hangup();
    }
  }

  private handlePluginError(error: JanusPluginError) {
    if (error.code === 478) {
      notyf.error('Пользователь не существует');// Пользователь не существует
      if (this.activeCall && this.activeCall.state === "unanswered") {
        let declinedCall = this.activeCall;
        this.activeCall = null;
        declinedCall.state = "declined";
        this.emitEvent({
          type: "callStateChange",
          call: declinedCall,
          declineReason: "error",
          declineMessage: "Номер не существует",
        })
      }
    } else if (error.code === 479) {
      notyf.error('Нельзя позвонить себе');// Нельзя позвонить себе
      if (this.activeCall && this.activeCall.state === "unanswered") {
        let declinedCall = this.activeCall;
        this.activeCall = null;

        declinedCall.state = "declined";
        this.emitEvent({
          type: "callStateChange",
          call: declinedCall,
          declineReason: "error",
          declineMessage: "Нельзя позвонить себе",
        })
      }
    }
  }

  private emitEvent(event: ClientEvent) {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  private getAudioElement(): HTMLAudioElement {
    let audioElement = document.querySelector("#js-calling-client-audio") as HTMLAudioElement;
    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.setAttribute("autoplay", "autoplay");
      audioElement.style.display = "none";
      audioElement.id = "js-calling-client-audio";
      document.body.appendChild(audioElement);
    }
    return audioElement;
  }

  private registerInPlugin() {
    return new Promise<void>((resolve, reject) => {
      this.pluginHandle.send({
        message: { request: "register", username: this.clientId },
        success: () => {
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }

  private assertHasRegistered() {
    if (!this.hasRegistered) {
      notyf.error('CallingClient не зарегистрирован.')
      throw new Error("CallingClient не зарегистрирован.");
    }
  }
}

interface JanusPluginEvent {
  type: string,
  msg: any,
  jsep: any,
}

interface JanusPluginError {
  code?: number,
  text?: string,
}

const CLIENT_ID_PREFIX = "cyber.";

function numberToClientId(number: string): string {
  return CLIENT_ID_PREFIX + number;
}

function clientIdToNumber(clientId: string): string {
  return clientId.slice(CLIENT_ID_PREFIX.length);
}
