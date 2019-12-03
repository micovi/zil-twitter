let CURRENT_URI;

if (process.env.NODE_ENV === "production") {
  CURRENT_URI = "http://52.28.110.70";
} else {
  CURRENT_URI = "http://localhost:4000";
}

const HASHTAG ='Zilliqa';

export { CURRENT_URI, HASHTAG };
