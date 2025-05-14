// utils.js
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    //console.log('1',document.cookie)
    const cookies = document.cookie.split(';');
    //console.log('2',cookies)
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  console.log('3',cookieValue);
  return cookieValue;
}
