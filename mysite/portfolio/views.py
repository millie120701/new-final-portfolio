from django.shortcuts import render

# Create your views here.


def index(request):
    return render(request, 'index.html')

def about(request):
    return render(request, "about.html")


def contact(request):
    return render(request, "contact.html")

def projects(request):
    return render(request, "projects.html")

def education(request):
    return render(request, "education.html")