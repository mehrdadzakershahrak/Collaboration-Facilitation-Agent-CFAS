FROM python:3.7

LABEL maintainer = "Blake Harrison <blake@keruki.com>, Mehrdad Zakershahrak <mehrdad@asu.edu>"

RUN mkdir /src

RUN chmod -R u+x /src/

ADD src /src/
WORKDIR /src

RUN apt-get clean
RUN apt-get update -y

RUN apt-get install default-libmysqlclient-dev -y

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

ENTRYPOINT ["python3"]
CMD ["main.py"]
