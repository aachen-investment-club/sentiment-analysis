from preprocessing import preprocess_text, preprocess_pdf
from transformers import BertTokenizer, BertForSequenceClassification, pipeline
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from collections import defaultdict

_MODEL_NAME = "yiyanghkust/finbert-tone"
_FINBERT_C = BertForSequenceClassification.from_pretrained(_MODEL_NAME, num_labels=3)
_TOKENIZER_C = BertTokenizer.from_pretrained(_MODEL_NAME)

_TOKENIZER_R = AutoTokenizer.from_pretrained("LHF/finbert-regressor")
_FINBERT_R= AutoModelForSequenceClassification.from_pretrained("LHF/finbert-regressor")

_FINBERT_DE = AutoModelForSequenceClassification.from_pretrained('scherrmann/GermanFinBert_SC_Sentiment')
_TOKENIZER_DE = AutoTokenizer.from_pretrained('scherrmann/GermanFinBert_SC_Sentiment')

_PIPELINE = pipeline("sentiment-analysis", model=_FINBERT_R, tokenizer=_TOKENIZER_R)

def sentiment_analysis_text(text: str, german: bool, regression: bool = False) -> tuple[str, float, list[dict]]:
    if regression: 
        _PIPELINE.model = _FINBERT_R
        _PIPELINE.tokenizer = _TOKENIZER_R
    else: 
        if german:
            _PIPELINE.model = _FINBERT_DE
            _PIPELINE.tokenizer = _TOKENIZER_DE
        else:
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C
    
    preprocessed_text = preprocess_text(text)
    results = _PIPELINE(preprocessed_text)
    overall_sentiment, confidence = aggregate_sentiment(results)
    return overall_sentiment, confidence, results

def sentiment_analysis_pdf(pdf_url: str, german: bool, regression: bool = False) -> tuple[str, float, list[dict]]:
    if regression: 
        _PIPELINE.model = _FINBERT_R
        _PIPELINE.tokenizer = _TOKENIZER_R
    else: 
        if german:
            _PIPELINE.model = _FINBERT_DE
            _PIPELINE.tokenizer = _TOKENIZER_DE
        else:
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C

    preprocessed_text = preprocess_pdf(pdf_url)
    results = _PIPELINE(preprocessed_text)
    overall_sentiment, confidence = aggregate_sentiment(results)
    return overall_sentiment, confidence, results

def aggregate_sentiment(sentence_sentiment: list[dict]) -> dict:
    """
    sentence_preds: list of dicts like [{'label': 'Positive', 'score': 0.86}, ...]
    returns: overall sentiment and approximate confidence
    """
    label_count = defaultdict(float)

    # Count scores by label
    for pred in sentence_sentiment:
        label_count[pred['label']] += pred['score']

    # Normalize scores to get percentages
    sum_scores = sum(label_count.values())
    
    for label in label_count:
        label_count[label] /= sum_scores

    # Get highest score
    max_score = max(label_count.values())
    max_label = max(label_count, key=label_count.get)

    # Calculate confidence
    confidence = round(max_score * 100, 1)

    return max_label, confidence

if __name__ == "__main__":
    #pdf_url = "../../example_articles/bitcoin_article.pdf"
    #print(sentiment_analysis_pdf(pdf_url, True))
    #print(preprocess_pdf(pdf_url))
    text = """
    The slide in cryptocurrency prices continues, and Bitcoin is now trading well below 100,000 dollars. Large investors are dumping their positions on the market — but some are buying right now.

The price slump in the crypto market is expanding more and more. Bitcoin is now trading around the 90,000-dollar mark — almost one-third below the peak it reached in October. According to industry service CoinGecko, all cryptocurrencies together have lost around 1.2 trillion dollars (just over one trillion euros) in market value over the past six weeks.

“The wave-like sell-off is being amplified because publicly listed companies and institutional investors are unwinding positions after heavy purchases during the rally, which increases contagion risks across the entire market. When support levels vanish and macroeconomic uncertainty rises, confidence can erode with remarkable speed,” crypto expert Joshua Chu of the Hong Kong Web3 Association told Reuters.

Along with Bitcoin’s plunge, shares of crypto companies such as Bitcoin-holder Strategy, mining firms Riot and Mara, and the trading platform Coinbase are also suffering heavy losses. Large investors — the so-called whales — who are liquidating their positions are largely responsible for the drop. However, not everyone is selling — some investors are using the setback to buy more.

First and foremost El Salvador: The Central American country has taken advantage of the recent price decline and purchased 1,090 Bitcoin at around 90,000 dollars, as President Nayib Bukele announced on the social media platform X. This increases the country’s strategic Bitcoin reserves to 7,474 Bitcoin, according to industry service Coinpedia.

This purchase underscores the country’s determination to continue treating Bitcoin as a long-term national asset. The government is committed to the principle of “buy the dip,” buying when Bitcoin prices fall, and systematically expanding its state reserves — positioning the world’s largest cryptocurrency as an important component of the country’s economic vision.

Bitcoin is legal tender in El Salvador. In September 2021, the country became the first worldwide to introduce Bitcoin as legal tender, equal to the US dollar. This means that businesses are required to accept payments in Bitcoin where technically possible, and citizens can also receive government services and payments in Bitcoin.


The tax treatment of cryptocurrencies in Germany is on the verge of major change. With the DAC-8 directive recently passed by the Bundestag, crypto service providers will be required to report extensive user data to authorities starting in 2027.

While the reporting obligation is already decided, an even more far-reaching change is looming in the background: the tax-free holding period for cryptocurrencies is under heavy attack. The Green Party and the Left Party have introduced resolutions to abolish the holding period. Initially rejected, the SPD has now also signaled support. Currently, profits from crypto investments become tax-free after a one-year holding period, based on their classification as private economic assets.

This classification is logically consistent from a tax-system perspective: Bitcoin — like gold or other precious metals — does not generate interest or dividends and grants no rights against third parties. The same applies to artworks and collectibles such as classic cars, luxury watches, or Pokémon cards, as well as commodities and foreign currencies.

I do not want to argue against taxation in principle — for me, what matters most is consistent equal treatment. Bitcoin is certainly not a security: HODLing generates neither capital returns nor contractual claims. However, this clear distinction does not apply to all crypto assets. With Ethereum or Solana, which can generate returns for the owner via staking, the line is already blurred. Even more so with protocol tokens that provide distributions or programmatic buybacks.

For fair tax treatment, one would need to be able to differentiate between different types of crypto and tokens. One thing seems immovable: if Bitcoin were to lose its special tax regime, then — for the sake of consistency — the same would have to apply to gold and other speculative tangible assets. Politically, that would be a much more difficult debate.
"""
    print(sentiment_analysis_text(text, False))