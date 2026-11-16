import os

from flask import Flask, render_template, send_from_directory


app = Flask(__name__)


@app.get("/")
@app.get("/detector")
def inicio():
    return render_template("primera_pagina/index.html")


@app.get("/como-funciona")
def como_funciona():
    return render_template("como_se_hace/index.html")


@app.get("/modelo/<path:filename>")
def modelo(filename):
    return send_from_directory(os.path.join(app.root_path, "modelo"), filename)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG") == "1",
    )
