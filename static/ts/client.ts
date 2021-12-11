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


async function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

export interface CallStateChangeEvent {
  type: "callStateChange",
  call: Call,
}

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
  number: string | undefined = undefined;
  activeCall: Call | null = null;
  isOutMuted: boolean = true;
  isInMuted: boolean = false;

  private eventHandlers: ClientEventHandler[] = [];
  private static singleton: CallingClient | null = null;

  static get(): CallingClient {
    if (!this.singleton) {
      this.singleton = new CallingClient();
    }
    return this.singleton;
  }

  private constructor() {}

  async register(number: string): Promise<void> {
    this.number = number;

    await delay(400);

    if (Math.random() < 0.2) {
      throw new Error("Ошибка при регистрации");
    } else {
      // no op
    }
  }

  async call(number: string): Promise<void> {
    await delay(400);

    if (Math.random() < 0.2) {
      throw new Error("Абонент занят");
    } else {
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

      setTimeout(() => {
        if (Math.random() < 0.5) {
          let declinedCall = this.activeCall!;
          this.activeCall = null;
          declinedCall.state = "declined";

          this.emitEvent({
            type: "callStateChange",
            call: declinedCall,
          });
        } else {
          this.activeCall!.state = "accepted";
          this.emitEvent({
            type: "callStateChange",
            call: this.activeCall!,
          });
        }
      }, 3000);
    }
  }

  addEventHandler(handler: ClientEventHandler) {
    this.eventHandlers.push(handler);
  }

  private emitEvent(event: ClientEvent) {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  async acceptCall() {
    if (!this.activeCall || this.activeCall.type != "incoming" || this.activeCall.state != "unanswered") {
      throw new Error("Нет входящего звонка");
    }

    await delay(400);

    if (Math.random() < 0.2) {
      throw new Error("Не удалось принять звонок");
    } else {
      this.activeCall.state = "accepted";
      this.emitEvent({
        type: "callStateChange",
        call: this.activeCall!,
      });
    }
  }

  async hangupCall() {
    if (!this.activeCall) {
      throw new Error("Нет активного звонка");
    }

    await delay(400);

    if (Math.random() < 0.2) {
      throw new Error("Не удалось отклонить звонок");
    } else {
      let declinedCall = this.activeCall!;
      this.activeCall = null;
      declinedCall.state = "declined";

      this.emitEvent({
        type: "callStateChange",
        call: declinedCall,
      });
    }
  }

  setOutMuted(muted: boolean) {
    this.isOutMuted = muted;
  }

  setInMuted(muted: boolean) {
    this.isInMuted = muted;
  }

  callme() {
    this.activeCall = {
      type: "incoming",
      fromNumber: "1231",
      toNumber: this.number || "1234",
      state: "unanswered",
    };
    this.emitEvent({
      type: "incomingCall",
      call: this.activeCall!,
    });
    this.emitEvent({
      type: "callStateChange",
      call: this.activeCall!,
    });
  }
}

window.callme = () => {
  let client = CallingClient.get();
  client.callme();
}
