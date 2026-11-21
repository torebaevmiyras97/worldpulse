# WorldPulse — boshlang‘ich MVP

Bu paket WorldPulse xalqaro yangiliklar portalining birinchi ishlaydigan asosidir.
Planshet brauzerida bosh sahifani ko‘rish mumkin; server qismi esa RSS manbalaridan
yangiliklarni yig‘ish uchun tayyorlangan.

## Hozir nimalar bor?
- Telefon va planshetga mos uch tilli (UZ/RU/EN) yangiliklar interfeysi.
- Kategoriya filtrlari, qidiruv va maqola kartalari.
- FastAPI serveri va SQLite ma’lumotlar bazasi.
- RSS manbalarini davriy tekshirish uchun bot.
- Bir xil havolalarni takror joylamaslik.
- Manba nomi va asl maqolaga havola.
- Reklama joylari uchun tayyor, hozircha demo ko‘rinishidagi bloklar.

## Muhim
Bu birinchi MVP. Hozircha tarjima/AI qayta yozish, AdSense va haqiqiy reklama daromadi
ulanmagan. Reklama hisobini tasdiqlash va saytga trafik olib kelish talab etiladi.
Demo yangiliklar haqiqiy yangilik sifatida ko‘rsatilmaydi. RSS bot yoqilgach, faqat
manba sarlavhasi va qisqa tavsifi olinadi; to‘liq maqola nusxalanmaydi.

## Planshetda ishga tushirish
Eng oson yo‘l — Replit kabi bulutli Python muhiti orqali:
1. Replit’da yangi Python project oching.
2. Ushbu ZIP ichidagi fayllarni project’ga yuklang.
3. Shell/Console’da `pip install -r requirements.txt` buyrug‘ini bajaring.
4. `uvicorn app.main:app --host 0.0.0.0 --port 8000` buyrug‘ini ishga tushiring.
5. Platforma bergan web preview havolasini oching.

Lokal kompyuterda ham xuddi shu buyruqlar ishlaydi.

## RSS manbalarini sozlash
`app/feeds.py` ichida RSS manbalar ro‘yxati bor. Ishlatishdan oldin har bir manbaning
RSS shartlari, qayta foydalanish qoidalari va litsenziyasini tekshiring. RSS manbasidan
olingan matnni to‘liq ko‘chirmang.

## Botni yoqish
`app/main.py` dagi `ENABLE_RSS_BOT` qiymatini `true` qiling. Dastlab sinov uchun
`false` qoldirilgan. Ishlab turgan server botni har 15 daqiqada tekshiradi.

## Keyingi bosqichlar
1. AI tarjima va qisqa original xulosa.
2. Muhim/sensitiv xabarlar uchun tekshiruv va ishonchlilik qoidalari.
3. Admin paneli va tahrirlash imkoniyati.
4. Maxfiy kalitlar orqali reklama va analitika integratsiyasi.
5. Domen, hosting, xavfsizlik va zaxira nusxa.
