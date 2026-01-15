.PHONY: run build

build:
	docker-compose build

run: build
	docker-compose run --rm jupyter bash -c "cd /home/jovyan/notebooks && pip install -r requirements.txt && jupyter nbconvert --to notebook --execute Zimstockdata.tk.comprehensive.ipynb"