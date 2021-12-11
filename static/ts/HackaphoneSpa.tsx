import { Component, h } from "preact";
import CallingClient from "./client";

interface HackaphoneSpaState {
  isRegistration: boolean,
  isLogin: boolean,
  isWaitingConnection: boolean,
  isClientBusy: boolean,
  isStandBy: boolean,
  isSomeoneIsCalling: boolean,
  isCanMakeCall: boolean,
  isOnCall: boolean
}

export default class HackaphoneSpa extends Component<{}, HackaphoneSpaState> {
  client: CallingClient;
  numberInput: HTMLInputElement | null = null;
  someOneCallingModal: HTMLDivElement | null = null;

  constructor(props: {}) {
    super(props);

    this.state = {
      isRegistration: true,
      isLogin: false,
      isWaitingConnection: false,
      isClientBusy: false,
      isStandBy: false,
      isSomeoneIsCalling: false,
      isCanMakeCall: false,
      isOnCall: false
    }

    this.client = CallingClient.get();
    this.client.addEventHandler(event => {
      if (event.type === "incomingCall") {
        this.renderCallingWindow();
      } else if (event.type === "callStateChange") {
        // Изменился статус звонка, входящего или исходящего
        // См. данные в event.call.
        if (event.call.state === "declined") {
          // Звонок отклонен. Если входящий - пользователем, если исходящий - другим абонентом.
        } else if (event.call.state === "accepted") {
          // Звонок принят, соединение установилось
        } else if (event.call.state === "finished") {
          // Звонок завершен.
        }
      }
    });
  }

  dropAllStateFlags() {
    this.setState({
      isRegistration: false,
      isLogin: false,
      isWaitingConnection: false,
      isClientBusy: false,
      isStandBy: false,
      isSomeoneIsCalling: false,
      isCanMakeCall: false,
      isOnCall: false,
    })
  }

  setNewState(newState: Partial<HackaphoneSpaState>) {
    this.dropAllStateFlags();
    this.setState(newState);
  }

  async registerNewClient() {
    if (this.numberInput && this.numberInput.value) {
      let clientNumber = this.numberInput.value;
      await this.client.register(clientNumber);
      this.setNewState({ isStandBy: true });
    }
  }

  loginClient() {
    this.setNewState({ isStandBy: true });
  }

  async acceptCall() {
    this.setNewState({ isOnCall: true })
    await this.client.acceptCall();
  }

  async refuseCall() {
    this.setNewState({ isStandBy: true });
    await this.client.hangupCall();
  }

  async makeCall() {
    this.setNewState({ isWaitingConnection: true });
    let number = this.numberInput!.value;
    console.log(number)
    this.client.call(number)
  }

  renderLoginRegisterWindow() {
    return (
      <div className="mx-auto">
        <h1 className="h3 mb-3 fw-normal text-center">{this.state.isRegistration ? "Регистрация" : "Вход"}</h1>
        <div className="form-floating">
          <input type="text" className="form-control" maxLength={4} ref={el => this.numberInput = el} />
          <label>Номер</label>
        </div>
        <div className="checkbox mt-2 mb-2">
          <label className="me-2">
            {this.state.isRegistration ? "У вас уже есть номер?" : "Еще нет номера?"}
          </label>
          <button
            className="btn btn-link"
            onClick={() =>
              this.state.isRegistration ? this.setNewState({ isLogin: true }) : this.setNewState({ isRegistration: true })
            }>
            {this.state.isRegistration ? "Войдите" : "Зарегистрироваться"}
          </button>
        </div>
        <button
          className="w-100 btn btn-lg btn-primary"
          onClick={() =>
            this.state.isRegistration ? this.registerNewClient() : this.loginClient()
          }>
          {this.state.isRegistration ? "Зарегистрироваться" : "Войти"}
        </button>
      </div>
    )
  }

  renderCallingWindow() {
    let status = "00:32";
    if (this.state.isClientBusy) {
      status = "Абонент занят"
    } else if (this.state.isWaitingConnection) {
      status = "Соединение...";
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
            <h3>#4225</h3>
            <h3>{status}</h3>
            <div className="d-flex btn-primary rounded-circle m-5 p-5 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="fixed-bottom">
          <div className="d-flex justify-content-center align-items-center bg-primary">
            <button onClick={() => { this.setNewState({ isStandBy: true }) }} className="d-flex btn-danger rounded-circle m-2 p-3 shadow-lg">
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
          <input ref={el => this.numberInput = el} type="text" className="form-control border-dark" id="numberInputArea" aria-describedby="inputNumber" style="height: 12vh;" />
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

  renderStandByWindow() {
    return (
      <button onClick={() => { this.setNewState({ isCanMakeCall: true }) }} class="d-flex btn-success rounded-circle m-5 p-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="white" class="bi bi-telephone-fill" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
        </svg>
      </button>
    )
  }

  renderIncomingCall() {
    this.someOneCallingModal?.classList.remove("d-none");
  }

  render() {
    let content = this.renderLoginRegisterWindow();
    if (this.state.isStandBy) {
      content = this.renderStandByWindow();
    } else if (this.state.isCanMakeCall) {
      content = this.renderNumberInputWindow();
    } else if (this.state.isWaitingConnection || this.state.isOnCall) {
      content = this.renderCallingWindow();
    }

    return (
      <div className="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
        {content}
        <div ref={el => this.someOneCallingModal = el} class="card border-primary d-none fixed-top">
          <div class="card-header">Входящий вызов</div>
          <div class="card-body">
            <div className="d-flex justify-content-evenly">
              <button onClick={() => this.acceptCall()} type="button" class="btn btn-success">Принять</button>
              <button onClick={() => this.refuseCall()} type="button" class="btn btn-danger">Отклонить</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
