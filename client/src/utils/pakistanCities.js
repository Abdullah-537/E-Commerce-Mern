export const pakistaniCities = {
  "Punjab": [
    "Ahmadpur East", "Arifwala", "Attock", "Bahawalnagar", "Bahawalpur", "Bhalwal", "Burewala", "Chakwal", "Chiniot", "Chishtian", "Daska", "Dera Ghazi Khan", "Dijkot", "Faisalabad", "Fateh Jang", "Gojra", "Gujar Khan", "Gujranwala", "Gujrat", "Hafizabad", "Haroonabad", "Hasan Abdal", "Hasilpur", "Haveli Lakha", "Jalalpur Jattan", "Jaranwala", "Jhang", "Jhelum", "Kamalia", "Kāmoke", "Kasur", "Khanewal", "Khanpur", "Kharian", "Khushab", "Kot Abdul Malik", "Kot Addu", "Lahore", "Lalamusa", "Layyah", "Liaquat Pur", "Lodhran", "Mailsi", "Mandi Bahauddin", "Mian Channu", "Mianwali", "Multan", "Muridke", "Murree", "Muzaffargarh", "Nankana Sahib", "Narowal", "Okara", "Pakpattan", "Pattoki", "Qila Didar Singh", "Rabwah", "Rahim Yar Khan", "Rawalpindi", "Sadiqabad", "Sahiwal", "Sambrial", "Samundri", "Sargodha", "Sheikhupura", "Shujaabad", "Sialkot", "Taxila", "Toba Tek Singh", "Vihari", "Wah Cantonment", "Wazirabad"
  ],
  "Sindh": [
    "Badin", "Dadu", "Ghotki", "Hala", "Hyderabad", "Jacobabad", "Jamshoro", "Karachi", "Kashmore", "Khairpur", "Kotri", "Larkana", "Mirpur Khas", "Nawabshah", "Rohri", "Sanghar", "Sehwan", "Shikarpur", "Sukkur", "Tando Adam", "Tando Allahyar", "Tando Muhammad Khan", "Thatta", "Umerkot"
  ],
  "Khyber Pakhtunkhwa": [
    "Abbottabad", "Bannu", "Batkhela", "Charsadda", "Dera Ismail Khan", "Hangu", "Haripur", "Karak", "Kohat", "Mansehra", "Mardan", "Mingora", "Nowshera", "Peshawar", "Swabi", "Swat", "Tangi", "Tank", "Timergara"
  ],
  "Balochistan": [
    "Chaman", "Dera Allahyar", "Dera Murad Jamali", "Gwadar", "Hub", "Khuzdar", "Loralai", "Nushki", "Quetta", "Sibi", "Turbat", "Usta Muhammad", "Zhob"
  ],
  "Islamabad Capital Territory": [
    "Islamabad"
  ],
  "Gilgit-Baltistan": [
    "Gilgit", "Skardu"
  ],
  "Azad Kashmir": [
    "Bhimber", "Kotli", "Mirpur", "Muzaffarabad", "Rawalakot"
  ]
};

export const getProvinces = () => Object.keys(pakistaniCities);
export const getCitiesByProvince = (province) => pakistaniCities[province] || [];
