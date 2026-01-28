const tg = window.Telegram.WebApp
tg.ready()

const user = tg.initDataUnsafe.user

if (user) {
  document.getElementById("info").innerText =
    "id: " + user.id +
    " | kullanıcı adı: " + (user.username || "yok")
} else {
  document.getElementById("info").innerText = "telegramdan açılmadı"
}
