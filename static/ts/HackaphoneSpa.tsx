import { Component, h } from "preact";
import CallingClient, { Call } from "./client";
import { Notyf } from 'notyf';

// Create an instance of Notyf
const notyf = new Notyf();


interface HackaphoneSpaState {
  userNumber: string | null,
  dialNumber: string | null,
  activeCall: Call | null,
  isRegisted: boolean,
  isMuted: boolean,
  isRadioEnabled: boolean,
  isMicroButtonPressed: boolean,
}

export default class HackaphoneSpa extends Component<{}, HackaphoneSpaState> {
  client: CallingClient;
  someOneCallingModal: HTMLDivElement | null = null;

  constructor(props: {}) {
    super(props);

    this.state = {
      userNumber: null,
      dialNumber: null,
      activeCall: null,
      isRegisted: false,
      isMuted: false,
      isRadioEnabled: false,
      isMicroButtonPressed: false,
    }

    this.client = CallingClient.get();
    this.client.addEventHandler(event => {
      console.log("EVENT:", JSON.stringify(event))
      if (event.type === "callStateChange") {
        if (event.call.state === "accepted") {
          this.client.setInMuted(false);
          this.client.setOutMuted(true);
        }
        if (this.client.activeCall) {
          this.setState({ activeCall: { ...this.client.activeCall } });
        } else {
          this.setState({ activeCall: null });
        }
      }
    });
  }

  async registerNewClient() {
    try {
      if (!this.state.userNumber) {
        notyf.error('Введите корректный номер!');
        console.error("Введите номер!");
        return
      }
      await this.client.register(this.state.userNumber);
      this.setState({ isRegisted: true })
    } catch (e) {
      console.error(e);
    }
    notyf.success('Регистрация прошла успешно, ура!');
  }

  async acceptCall() {
    try {
      await this.client.acceptCall();
    } catch (e) {
      console.error(e);
    }
  }

  async refuseCall() {
    try {
      await this.client.hangupCall();
    } catch (e) {
      console.error(e);
    }
  }

  async makeCall() {
    if (!this.state.dialNumber) {
      console.error("Введите номер абонента");
      notyf.error('Введите номер абонента');
      return
    }
    try {
      this.client.call(this.state.dialNumber);
    } catch (e) {
      notyf.error('Ошибка.');
      console.error(e);
    }
  }

  onPressMicroButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) {
    // Событие при нажатии и удерживании кнопки микрофона
    if (event.button === 0) {
      event.preventDefault();
      this.setState({ isMicroButtonPressed: true });
      this.client.setInMuted(true); // Глушим входящий звук
      this.client.setOutMuted(false); // Активируем наш микрофон
    }
  }

  onReleaseMicroButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) {
    // Событие при отпускании кнопки микрофона
    if (event.button === 0) {
      event.preventDefault();
      this.setState({ isMicroButtonPressed: false });
      this.client.setInMuted(false); // Активируем входящий звук
      this.client.setOutMuted(true); // Глушим наш микрофон
    }
  }

  // Кнопка радио няни
  onPressRadioNyanyaButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (this.state.isRadioEnabled) { // Если кнопка радио няни активна - отключаем её
      try {
        this.setState({ isRadioEnabled: false })
        this.client.setOutMuted(true); // Глушим наш микрофон
      } catch (e) {
        console.error(e)
      }
    }
    else { // Кнопка радио няни неактивна - включаем её
      try {
        this.setState({ isRadioEnabled: true })
        this.client.setOutMuted(false); // Включаем наш микрофон
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Кнопка отключения звука
  mutePerson(event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (this.state.isMuted) { // Если человек уже замьючен
      try {
        this.client.setInMuted(false);
        this.setState({ isMuted: false })
      } catch (e) {
        console.error(e)
      }
    }
    else { // Иначе мьютим его
      try {
        this.client.setInMuted(true);
        this.setState({ isMuted: true })
      } catch (e) {
        console.error(e)
      }
    }
  }

  renderRegistrationWindow() {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <div class="form-signin">
          <h1 className="h3 mb-3 fw-normal text-center">Вход</h1>

          <div className="form-floating">
            <input
              value={this.state.userNumber ? this.state.userNumber : ""} onChange={event => this.setState({ userNumber: (event.target as HTMLInputElement).value })}
              type="text" className="form-control" id="floatingInput" maxLength={4} />
            <label for="floatingInput">Номер</label>
          </div>

          <div className="mt-3">
            <button
              className="w-100 btn btn-lg btn-primary"
              onClick={() => this.registerNewClient()}>
              Войти
            </button>
          </div>
        </div>
      </div>
    )
  }

  renderCallingWindow() {
    let status = "";
    if (!this.state.activeCall) {
      return;
    }

    if (this.state.activeCall.state === "unanswered" && this.state.activeCall.type === "outgoing") {
      status = "Соединение...";
    } else if (this.state.activeCall.state === "accepted") {
      status = "Соединено";
    }
    return (
      <div>
        <div className="container d-flex flex-column justify-content-center pt-5">
          <div className="d-flex bg-primary rounded-circle m-5 p-5 text-white shadow-sm border border-2 border-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="20vh" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
            </svg>
          </div>
          <div className="text-center" style="max-height: 70vh;">
            <h3>{status}</h3>
          </div>
        </div>

        {/* Кнопки */}
        <div className="fixed-bottom">
          <div class="d-flex justify-content-center align-items-center">
            {/* Микрофон */}
            {/* onMouseDown -> Событие, когда кнопка зажата */}
            {/* onMouseUp -> Событие, когда кнопку отпустили */}
            <button
              onMouseDown={(event) => { this.onPressMicroButton(event) }}
              onMouseUp={(event) => { this.onReleaseMicroButton(event) }}
              className="btn-primary rounded-circle m-2 p-3 text-white shadow-sm border border-2 border-secondary position-relative"
              style="width: 10vh; height: 10vh;"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Говорить"
            >
              <div
                className={this.state.isMicroButtonPressed ? "spinner-border text-light position-absolute" : "spinner-border text-light position-absolute d-none"}
                role="status"
                style="left:0;top:0;width:100%;height:100%;">
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z" />
              </svg>
            </button>

            {/* Радио Няня */}
            <button onClick={(event) => { this.onPressRadioNyanyaButton(event) }} className="btn-primary rounded-circle m-2 p-3 text-white shadow-sm border border-2 border-secondary position-relative" style="width: 10vh; height: 10vh;" data-bs-toggle="tooltip" data-bs-placement="top" title="Я - Радионяня">
              <div className={this.state.isRadioEnabled ? "spinner-grow text-light position-absolute" : "spinner-grow text-light position-absolute d-none"} role="status" style="left:0;top:0;width:100%;height:100%;">
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-broadcast" viewBox="0 0 16 16">
                <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707zm2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708zm5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708zm2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              </svg>
            </button>

            {/* Кнопка отключения входящего звука */}
            <button onClick={(event) => { this.mutePerson(event) }} className="btn-primary rounded-circle m-2 p-3 text-white shadow-sm border border-2 border-secondary" style="width: 10vh; height: 10vh;" data-bs-toggle="tooltip" data-bs-placement="top" title="Звук">
              {/* <!-- иконка включенного звука --> */}
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" className={this.state.isMuted ? "bi bi-volume-up d-none" : "bi bi-volume-up"} viewBox="0 0 16 16">
                <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z" />
                <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z" />
                <path d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z" />
              </svg>
              {/* <!-- иконка отключенного звука --> */}
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" className={this.state.isMuted ? "bi bi-volume-mute" : "bi bi-volume-mute d-none"} viewBox="0 0 16 16">
                <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z" />
              </svg>
            </button>
          </div>

          {/* footer */}
          <div className="bg-primary shadow-sm border-top border-2 border-secondary d-flex justify-content-center align-items-center">
            <button onClick={() => { this.refuseCall() }} className="btn-danger rounded-circle m-2 p-3 shadow-sm border border-2 border-secondary" style="width: 10vh; height: 10vh;" data-bs-toggle="tooltip" data-bs-placement="top" title="Отключиться">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" className="bi bi-telephone-x" viewBox="0 0 16 16">
                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                <path fill-rule="evenodd" d="M11.146 1.646a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  renderNumberInputWindow() {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style="max-height: 100vh;  max-width: 500px;">
        <div>
          <label for="numberInputArea" className="form-label">Введите номер:</label>
          <input
            value={this.state.dialNumber ? this.state.dialNumber : ""} onChange={event => this.setState({ dialNumber: (event.target as HTMLInputElement).value })}
            type="text"
            maxLength={4}
            className="form-control border-secondary shadow-sm text-center"
            id="numberInputArea"
            aria-describedby="inputNumber"
            style="height: 12vh;font-size: 10vh;" />
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <button onClick={() => { this.makeCall() }} className="d-flex btn-success rounded-circle m-5 p-5 shadow-sm border border-2 border-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="white" className="bi bi-telephone-fill" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  render() {
    let content: preact.JSX.Element | undefined = this.renderRegistrationWindow();
    if (this.state.isRegisted && !this.state.activeCall) {
      content = this.renderNumberInputWindow();
    } else if (this.state.activeCall) {
      if (this.state.activeCall.state === "accepted") {
        content = this.renderCallingWindow();
      } else if (this.state.activeCall.state === "unanswered" && this.state.activeCall.type === "outgoing") {
        content = this.renderCallingWindow();
      }
    }

    return (
      <div className="container d-flex justify-content-center" style="min-height: 95vh;">
        {content}
        <div className={
          this.client.activeCall?.type === "incoming" && this.state.activeCall?.state === "unanswered" ? "card border-primary fixed-top" : "card border-primary d-none fixed-top"
        }>
          <div className="card-header">Входящий вызов</div>
          <div className="card-body">
            <div className="d-flex justify-content-evenly">
              <button onClick={() => this.acceptCall()} type="button" className="btn btn-success">Принять</button>
              <button onClick={() => this.refuseCall()} type="button" className="btn btn-danger">Отклонить</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
