const accounts = JSON.parse(localStorage.getItem("kmail_accounts") || "[]");

function saveAccounts() {
  localStorage.setItem("kmail_accounts", JSON.stringify(accounts));
}

function addAccount() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) {
    alert("사용자 이름과 비밀번호를 입력하세요.");
    return;
  }
  const email = `${username}@kmail.kro.kr`;
  accounts.push({ username, email, password });
  saveAccounts();
  renderAccounts();
}

document.addEventListener("DOMContentLoaded", () => {
  renderAccounts();
});

function renderAccounts() {
  const container = document.getElementById("accountsContainer");
  container.innerHTML = "";
  accounts.forEach((acc, index) => {
    const div = document.createElement("div");
    div.className = "account";
    div.innerHTML = `
      <strong>${acc.email}</strong><br>
      <button onclick="fetchMails(${index})">📥 메일 불러오기</button>
      <button onclick="showSendForm(${index})">✉️ 메일 보내기</button>
      <button onclick="deleteAccount(${index})">🗑️ 삭제</button>
      <div class="mailList" id="mailBox${index}"></div>
      <div id="sendBox${index}"></div>
    `;
    container.appendChild(div);
  });
}

function deleteAccount(index) {
  if (confirm("계정을 삭제하시겠습니까?")) {
    accounts.splice(index, 1);
    saveAccounts();
    renderAccounts();
  }
}

function fetchMails(index) {
  const acc = accounts[index];
  fetch("/get-mails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(acc),
  })
    .then((res) => res.json())
    .then((data) => {
      const box = document.getElementById(`mailBox${index}`);
      box.innerHTML = `<h3>📬 받은 메일</h3><ul>` +
        data.messages.map(
          (m, i) =>
            `<li onclick="fetchDetail(${index}, ${i})"><strong>${m.subject}</strong> - ${m.from}</li>`
        ).join('') + "</ul>";
    })
    .catch(() => {
      alert("메일 불러오기 실패");
    });
}

function fetchDetail(index, i) {
  const acc = accounts[index];
  fetch(`/get-mail-detail?user=${encodeURIComponent(acc.email)}&index=${i}`)
    .then(res => res.json())
    .then(data => {
      alert(`제목: ${data.subject}\n보낸사람: ${data.from}\n내용: ${data.body}`);
    });
}

function showSendForm(index) {
  const sendBox = document.getElementById(`sendBox${index}`);
  sendBox.innerHTML = `
    <h3>✉️ 메일 보내기</h3>
    <input type="text" id="to${index}" placeholder="받는 사람 이메일" />
    <input type="text" id="subject${index}" placeholder="제목" />
    <textarea id="body${index}" placeholder="내용" rows="6"></textarea>
    <input type="file" id="file${index}" />
    <button onclick="sendMail(${index})">보내기</button>
  `;
}

function sendMail(index) {
  const acc = accounts[index];
  const to = document.getElementById(`to${index}`).value;
  const subject = document.getElementById(`subject${index}`).value;
  const body = document.getElementById(`body${index}`).value;
  const fileInput = document.getElementById(`file${index}`);

  const formData = new FormData();
  formData.append("email", acc.email);
  formData.append("password", acc.password);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("body", body);
  if (fileInput.files.length > 0) {
    formData.append("attachment", fileInput.files[0]);
  }

  fetch("/send-mail", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.text())
    .then((msg) => alert(msg))
    .catch(() => alert("메일 전송 실패"));
}
