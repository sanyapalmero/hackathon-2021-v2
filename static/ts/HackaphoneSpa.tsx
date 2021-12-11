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
    if (event.button === 0) {
      event.preventDefault();
      this.client.setInMuted(false);
      this.client.setOutMuted(true);
    }
  }

  onReleaseMicroButton(event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) {
    if (event.button === 0) {
      event.preventDefault();
      this.client.setInMuted(true);
      this.client.setOutMuted(false);
    }
  }

  renderRegistrationWindow() {
    return (
      <div className="mx-auto">
        <h1 className="h3 mb-3 fw-normal text-center">Вход</h1>
        <div className="form-floating">
          <input
            value={this.state.userNumber ? this.state.userNumber : ""} onChange={event => this.setState({ userNumber: (event.target as HTMLInputElement).value })}
            type="text" className="form-control" maxLength={4} />
          <label>Номер</label>
        </div>
        <div className="mt-2">
          <button
            className="w-100 btn btn-lg btn-primary"
            onClick={() => this.registerNewClient()}>
            Войти
          </button>
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
        <div className="d-flex flex-column justify-content-center align-items-center">
          <div className="d-flex bg-primary rounded-circle m-5 p-5 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
            </svg>
          </div>
          <div className="text-center">
            <h3>{status}</h3>
            <button onMouseUp={(event) => { this.onPressMicroButton(event) }} onMouseDown={(event) => { this.onReleaseMicroButton(event) }} className="d-flex btn-primary rounded-circle m-5 p-5 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="fixed-bottom">
          <div className="d-flex justify-content-center align-items-center bg-primary">
            <button onClick={() => { this.refuseCall() }} className="d-flex btn-danger rounded-circle m-2 p-3 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-telephone-x" viewBox="0 0 16 16">
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
      <div>
        <div>
          <label for="numberInputArea" className="form-label">Введите номер:</label>
          <input
            value={this.state.dialNumber ? this.state.dialNumber : ""} onChange={event => this.setState({ dialNumber: (event.target as HTMLInputElement).value })}
            type="text"
            maxLength={4}
            className="form-control border-dark"
            id="numberInputArea"
            aria-describedby="inputNumber"
            style="height: 12vh;" />
        </div>
        <div className="row text-center pt-5">
          <div className="col p-3 border-dark">
            <h3>1</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>2</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>3</h3>
          </div>
        </div>
        <div className="row text-center pt-4">
          <div className="col p-3 border-dark">
            <h3>4</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>5</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>6</h3>
          </div>
        </div>
        <div className="row text-center pt-4">
          <div className="col p-3 border-dark">
            <h3>7</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>8</h3>
          </div>
          <div className="col p-3 border-dark">
            <h3>9</h3>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <button onClick={() => { this.makeCall() }} className="d-flex btn-success rounded-circle m-5 p-5">
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
      <div className="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
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
