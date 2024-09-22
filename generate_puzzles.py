import random
import json

# Load word list
with open('backend/word_list.txt', 'r') as f:
    words = [word.strip() for word in f if len(word.strip()) == 5]

puzzles = []

# Generate puzzles
for _ in range(1000):
    start_word = random.choice(words)
    # Find words with no common letters
    end_candidates = [word for word in words if not set(word).intersection(set(start_word))]
    if end_candidates:
        end_word = random.choice(end_candidates)
        puzzles.append({
            'start_word': start_word,
            'end_word': end_word
        })

# Save puzzles to JSON
with open('backend/puzzles.json', 'w') as f:
    json.dump(puzzles, f)
