import os
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer

# 1. Data Collection and Metric Calculation
storage_paths = ["storage_node1", "storage_node2", "storage_node3"]
data_list = []

stopwords_set = {"the", "a", "of", "and", "in", "to", "is", "for", "on", "with", "as", "by"}

for storage_path in storage_paths:
    for filename in os.listdir(storage_path):
        filepath = os.path.join(storage_path, filename)
        
        if not os.path.isfile(filepath):
            continue
        
        with open(filepath, "r", encoding="utf-8") as file:
            raw_text = file.read()
            sentences = raw_text.split('\n')
            sentences = [s for s in sentences if s.strip()]
            
            text = raw_text.lower()
            words = re.findall(r'\b[a-z]{2,}\b', text)
            
            word_count = len(words)
            unique_words = set(words)
            unique_word_count = len(unique_words)
            lexical_diversity = unique_word_count / word_count if word_count > 0 else 0
            
            sentence_lengths = [len(s.split()) for s in sentences]
            avg_sentence_len = np.mean(sentence_lengths) if sentences else 0
            
            stopword_count = sum(1 for w in words if w in stopwords_set)
            stopword_ratio = stopword_count / word_count if word_count > 0 else 0
            
            data_list.append({
                "node": storage_path.replace('storage_', ''),
                "filename": filename.replace('_test.txt', ''),
                "word_count": word_count,
                "unique_word_count": unique_word_count,
                "lexical_diversity": lexical_diversity,
                "avg_sentence_len": avg_sentence_len,
                "stopword_ratio": stopword_ratio
            })

df = pd.DataFrame(data_list)
df.to_csv("data_interpretation/corpus_metrics.csv", index=False)

files = [os.path.join(storage_path, filename) for storage_path in storage_paths for filename in os.listdir(storage_path) if os.path.isfile(os.path.join(storage_path, filename))]

# 2. Visualizations

# Set style
sns.set_theme(style="whitegrid")

# Histogram: Distribution of word counts
plt.hist(df['word_count'], bins=10, color='skyblue', edgecolor='black')
plt.title("Histogram of Document Word Counts")
plt.xlabel("Total Words")
plt.ylabel("Frequency")
plt.savefig("data_interpretation/dist_histogram.png")
plt.close()

# Box Plot & Violin Plot: Lexical Diversity and Stopword Ratio
plt.subplot(1, 2, 1)
sns.boxplot(y=df['lexical_diversity'], color='lightgreen')
plt.title("Box Plot: Lexical Diversity")
plt.subplot(1, 2, 2)
sns.violinplot(y=df['stopword_ratio'], color='gold')
plt.title("Violin Plot: Stopword Ratio")
plt.tight_layout()
plt.savefig("data_interpretation/box_violin_metrics.png")
plt.close()

# Regression Plot: Heaps' Law (Word Count vs Unique Word Count)
sns.regplot(data=df, x="word_count", y="unique_word_count", scatter_kws={'alpha':0.5}, line_kws={'color':'red'})
plt.title("Regression Plot: Heaps' Law (Unique vs Total Words)")
plt.xlabel("Total Word Count")
plt.ylabel("Unique Word Count")
plt.savefig("data_interpretation/heaps_law_regression.png")
plt.close()

# Pair Plot: Multivariate Relationships
# Note: Pairplot creates its own figure
g = sns.pairplot(df.drop(columns=['filename']))
g.fig.suptitle("Pair Plot of Corpus Metrics", y=1.02)
g.savefig("data_interpretation/pair_plot.png")
plt.close()

# Heatmap: Term-Document Matrix (Top 20 terms across first 20 docs)
all_texts = []
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        all_texts.append(file.read().lower())

vectorizer = CountVectorizer(stop_words='english', max_features=20)
tdm = vectorizer.fit_transform(all_texts[:20])
tdm_df = pd.DataFrame(tdm.toarray(), columns=vectorizer.get_feature_names_out(), index=[f.replace('_test.txt', '') for f in files[:20]])

sns.heatmap(tdm_df, annot=True, cmap="YlGnBu", fmt='d')
plt.title("Term-Document Heatmap (Top 20 Terms in 20 Docs)")
plt.xlabel("Terms")
plt.ylabel("Documents")
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig("data_interpretation/term_doc_heatmap.png")
plt.close()

# Bar Plot: Average Sentence Length per Document (Top 15)
df_sorted = df.sort_values('avg_sentence_len', ascending=False).head(15)
sns.barplot(data=df_sorted, x="avg_sentence_len", y="filename", palette="viridis")
plt.title("Bar Plot: Top 15 Docs by Avg Sentence Length")
plt.xlabel("Average Sentence Length")
plt.ylabel("Document")
plt.tight_layout()
plt.savefig("data_interpretation/sentence_len_bar.png")
plt.close()

# Scatter Plot: Lexical Diversity vs Stopword Ratio
sns.scatterplot(data=df, x="lexical_diversity", y="stopword_ratio", hue="word_count", size="word_count", sizes=(20, 200), alpha=0.7)
plt.title("Scatter Plot: Diversity vs Stopword Ratio")
plt.savefig("data_interpretation/diversity_scatter.png")
plt.close()

print(df.head())
print("Visualizations completed.")
