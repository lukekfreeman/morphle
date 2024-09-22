from flask import Flask, jsonify, send_from_directory, request
import json
import datetime
import random

app = Flask(__name__)

with open('backend/puzzles.json', 'r') as f:
    puzzles = json.load(f)

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('frontend', path)

@app.route('/get_puzzle')
def get_puzzle():
    mode = request.args.get('mode', 'daily')
    if mode == 'daily':
        idx = datetime.datetime.now().date().toordinal() % len(puzzles)
        puzzle = puzzles[idx]
    else:
        puzzle = random.choice(puzzles)
    return jsonify(puzzle)

if __name__ == '__main__':
    app.run(debug=True)
