from django.shortcuts import render
from django.http import HttpResponse
from .sudoku_generator import generate_sudoku
import pickle
from django.http import JsonResponse

# Create your views here.


def index(request, difficulty=None):
    if difficulty is None:
        difficulty = "easy"  # Set default difficulty to "easy"
    sudoku_board, sudoku_solution = generate_sudoku(difficulty)
    return render(request, "sudoku/sudoku_index.html", {'sudoku_board': sudoku_board, 'sudoku_solution': sudoku_solution})


def load_pickle_data(request):
    with open('sudoku_game/easy.pkl', 'rb') as f:
        data = pickle.load(f)
    return JsonResponse(data)
