function convertToPersianWords(number) {
  if (number === 0) return "صفر";
  if (!number) return "";

  const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = [
    "ده",
    "یازده",
    "دوازده",
    "سیزده",
    "چهارده",
    "پانزده",
    "شانزده",
    "هفده",
    "هجده",
    "نوزده",
  ];
  const tens = [
    "",
    "",
    "بیست",
    "سی",
    "چهل",
    "پنجاه",
    "شصت",
    "هفتاد",
    "هشتاد",
    "نود",
  ];
  const hundreds = [
    "",
    "صد",
    "دویست",
    "سیصد",
    "چهارصد",
    "پانصد",
    "ششصد",
    "هفتصد",
    "هشتصد",
    "نهصد",
  ];
  const thousands = ["", "هزار", "میلیون", "میلیارد"];

  function convertChunk(num) {
    let res = "";
    let h = Math.floor(num / 100);
    let t = Math.floor((num % 100) / 10);
    let u = num % 10;

    if (h > 0) res += hundreds[h] + " و ";
    if (t === 1) {
      res += teens[u];
    } else {
      if (t > 1) res += tens[t] + " و ";
      if (u > 0) res += units[u];
    }
    return res.replace(/ و $/, "");
  }

  let result = "";
  let chunkCount = 0;
  while (number > 0) {
    let chunk = number % 1000;
    if (chunk > 0) {
      let chunkWords = convertChunk(chunk);
      result = chunkWords + " " + thousands[chunkCount] + " و " + result;
    }
    number = Math.floor(number / 1000);
    chunkCount++;
  }
  return result.replace(/ و $/, "").trim();
}
export default convertToPersianWords;
