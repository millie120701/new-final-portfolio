from django.shortcuts import render

# Create your views here.


def index(request):
    return render(request, 'portfolio/index.html')

def about(request):
    return render(request, "portfolio/about.html")


def contact(request):
    return render(request, "portfolio/contact.html")

def projects(request):
    return render(request, "portfolio/projects.html")

def education(request):
    return render(request, "portfolio/education.html")