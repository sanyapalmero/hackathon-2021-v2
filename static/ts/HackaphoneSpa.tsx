import { Component, h } from "preact";
import CallingClient, { Call } from "./client";
import { Notyf } from 'notyf';
import classNames from "classnames";

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
      if (this.state.userNumber.length != 4) {
        notyf.error('Номер состоит ровно из 4 цифр.');
        console.error("Номер состоит ровно из 4 цифр.");
        return
      }
      if (isNaN(+this.state.userNumber)) {
        notyf.error('Номер состоит только из цифр.');
        console.error("Номер состоит только из цифр.");
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
    if (!/^\d{4}$/.test(this.state.dialNumber)) {
      notyf.error('Введите номер из 4 цифр');
      return
    }

    try {
      this.client.call(this.state.dialNumber);
    } catch (e) {
      notyf.error('Ошибка.');
      console.error(e);
    }
  }

  async makeCallTo(number: string) {
    if (!number) {
      console.error("Введите номер абонента");
      notyf.error('Введите номер абонента');
      return
    }
    if (!/^\d{4}$/.test(number)) {
      notyf.error('Введите номер из 4 цифр');
      return
    }

    try {
      this.client.call(number);
    } catch (e) {
      notyf.error('Ошибка.');
      console.error(e);
    }
  }

  onPressMicroButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement> | h.JSX.TargetedTouchEvent<HTMLButtonElement>) {
    // Событие при нажатии и удерживании кнопки микрофона
    event.preventDefault();
    this.setState({ isMicroButtonPressed: true });
    this.client.setInMuted(true); // Глушим входящий звук
    this.client.setOutMuted(false); // Активируем наш микрофон
  }

  onReleaseMicroButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement> | h.JSX.TargetedTouchEvent<HTMLButtonElement>) {
    // Событие при отпускании кнопки микрофона
    event.preventDefault();
    this.setState({ isMicroButtonPressed: false });
    this.client.setInMuted(false); // Активируем входящий звук
    this.client.setOutMuted(true); // Глушим наш микрофон
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

    (event.target as HTMLButtonElement).blur();
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
      <div className="d-flex justify-content-center">
        <div class="regform w-100" style="margin-top: 28px; margin-bottom: 32px;">
          <img src="/static/images/reg-illustration.png" className="regform__image" width="260" height="294"/>

          <div className="regform__form">
            <div className="container py-4">
              <p className="mb-3 fw-bold">Добро пожаловать! Познакомимся?</p>

              <div className="form-group mb-3">
                <label class="form-label">Номер этого устройства</label>
                <input
                  value={this.state.userNumber ? this.state.userNumber : ""}
                  onChange={event => this.setState({ userNumber: (event.target as HTMLInputElement).value })}
                  type="text"
                  className="form-control"
                  maxLength={4}
                  placeholder="1234"
                />
              </div>

              <button
                className="w-100 btn btn-primary"
                onClick={() => this.registerNewClient()}
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  get isInCallingWindow(): boolean {
    if (!this.state.activeCall) {
      return false;
    }

    let isAccepted = this.state.activeCall.state === "accepted";
    let isWaitingForAnswer = this.state.activeCall.state === "unanswered" && this.state.activeCall.type === "outgoing";

    return isAccepted || isWaitingForAnswer;
  }

  renderCallingWindowControls() {
    if (!this.state.activeCall) {
      return null;
    }

    if (this.state.activeCall.state === "unanswered") {
      return (
        <div
          class="d-flex flex-column justify-content-center align-items-center"
          style="min-height: 90px; margin-bottom: 24px;"
        >
          <div class="text-muted">Устанавливаем соединение...</div>
        </div>
      );
    } else {
      return (
        <div
          class="d-flex flex-column"
          style="margin-bottom: 24px;"
        >
          <button
            onMouseDown={(event) => { this.onPressMicroButton(event) }}
            onMouseUp={(event) => { this.onReleaseMicroButton(event) }}
            onTouchStart={(event) => { this.onPressMicroButton(event) }}
            onTouchEnd={(event) => { this.onReleaseMicroButton(event) }}
            onContextMenu={event => event.preventDefault()}
            className={classNames("btn", {
              "btn-primary": this.state.isMicroButtonPressed,
              "btn-outline-primary": !this.state.isMicroButtonPressed,
            })}
            disabled={this.state.isRadioEnabled}
            style="user-select: none; width: 200px; margin-bottom: 12px;"
          >
            <i class="bi bi-mic-fill"></i> Говорить
          </button>
          <button
            onClick={(event) => { this.onPressRadioNyanyaButton(event) }}
            className={classNames("btn", {
              "btn-primary": this.state.isRadioEnabled,
              "btn-outline-primary": !this.state.isRadioEnabled,
            })}
            style="width: 200px;"
            key={this.state.isRadioEnabled}
          >
            <i class="bi bi-broadcast"></i> Я - "радионяня"
          </button>
        </div>
      );
    }
  }

  renderCallingWindow() {
    if (!this.state.activeCall) {
      return null;
    }

    let otherNumber;
    if (this.state.activeCall.type === "incoming") {
      otherNumber = this.state.activeCall.fromNumber;
    } else {
      otherNumber = this.state.activeCall.toNumber;
    }

    return (
      <div className="d-flex flex-column" style="min-height: 100vh;">
        <div className="bg-info text-white flex-grow-1 d-flex flex-column justify-content-center align-items-center">
          <div className="d-flex flex-column align-items-center" style="margin-top: 60px;">
            <i class="bi bi-telephone-fill" style="font-size: 54px; opacity: 0.5; margin-bottom: 26px;"></i>
            <div style="margin-bottom: 24px;">
              <h1 style="margin-bottom: 0;">{otherNumber}</h1>
            </div>
            <div>
              <button
                onClick={(event) => { this.mutePerson(event) }}
                className="round-button"
              >
                <i className={classNames("round-button__icon", "bi", this.state.isMuted ? "bi-volume-mute" : "bi-volume-up")}></i>
              </button>
            </div>
          </div>
        </div>
        <div style="padding-top: 28px; padding-bottom: 36px;">
          <div class="d-flex flex-column align-items-center mx-auto">
            {this.renderCallingWindowControls()}
            <button
              class="btn btn-danger"
              onClick={() => this.refuseCall()}
              style="width: 200px;"
            >Завершить</button>
          </div>
        </div>
      </div>
    );
  }

  renderContacts() {
    let contacts: {title: string, description: string, dial: string}[] = [];

    if (/^\d{4}$/.test(this.state.dialNumber || "")) {
      contacts.push({
        title: this.state.dialNumber || "",
        description: "Позвонить",
        dial: this.state.dialNumber || "",
      });
    }

    // Здесь можно добавить в contacts контакты, найденные фильтром

    return contacts.map(contact => (
      <button
        class="list-group-item list-group-item-action"
        onClick={() => this.makeCallTo(contact.dial)}
      >
        <h5 class="mb-1">{contact.title}</h5>
        <p class="mb-1">{contact.description}</p>
      </button>
    ));
  }

  renderNumberInputWindow() {
    let renderedContacts = this.renderContacts();

    return (
      <div class="container">
        <div class="text-center" style="padding-top: 40px; padding-bottom: 40px; margin-bottom: 8px;">
          <h6 class="fw-normal text-muted" style="margin-bottom: 28px;">Ваш номер Hackaphone</h6>
          <h1>{this.state.userNumber}</h1>
        </div>
        <div>
          <input
            value={this.state.dialNumber ? this.state.dialNumber : ""}
            onInput={event => this.setState({ dialNumber: (event.target as HTMLInputElement).value })}
            type="text"
            maxLength={4}
            className="form-control"
            placeholder="Кому звоним?"
            style="margin-bottom: 12px;"
          />
          {renderedContacts.length > 0 ? <div class="list-group">{renderedContacts}</div> : null}
        </div>
      </div>
    );
  }

  renderHeader() {
    if (this.isInCallingWindow) {
      return null;
    }

    if (!this.state.isRegisted) {
      return (
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
          <div class="container">
            <div class="navbar-brand">Hackaphone</div>
          </div>
        </nav>
      );
    }

    return (
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <div class="navbar-brand">Hackaphone</div>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbar-menu">
            <div className="me-auto"></div>
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link" href="/">Выход</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  renderContent() {
    if (!this.state.isRegisted) {
      return this.renderRegistrationWindow();
    } else if (this.isInCallingWindow) {
      return this.renderCallingWindow();
    } else {
      return this.renderNumberInputWindow();
    }
  }

  renderIncomingCall() {
    if (!this.state.activeCall || this.state.activeCall.type !== "incoming" || this.state.activeCall.state !== "unanswered") {
      return null;
    }

    return (
      <div className="card text-white text-center bg-info fixed-top shadow" style="margin: 12px;">
        <div className="card-header">Входящий вызов</div>
        <div className="card-body">
          <div style="margin-bottom: 16px;">
            <h2>{this.state.activeCall.fromNumber}</h2>
          </div>
          <div className="d-flex">
            <button onClick={() => this.acceptCall()} type="button" className="btn btn-success" style="flex: 1 1 0; margin-right: 4px;">Принять</button>
            <button onClick={() => this.refuseCall()} type="button" className="btn btn-danger" style="flex: 1 1 0; margin-left: 4px;">Отклонить</button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="page">
        <div className="page__header">
          {this.renderHeader()}
        </div>
        <div className="page__content position-relative">
          {this.renderContent()}
          {this.renderIncomingCall()}
        </div>
      </div>
    )
  }
}
