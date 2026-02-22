# Nginx SSL 인증서 설정 가이드 (다른 서버 배포용)

이 프로젝트는 Docker 환경에서 Nginx를 리버스 프록시로 사용하여 HTTPS를 제공합니다. 다른 서버에 배포할 때 인증서를 설정하는 방법은 다음과 같습니다.

## 1. 운영 환경: Let's Encrypt (Certbot) 사용
공인 도메인(`translate.jbch.org` 등)을 사용하는 경우 무료로 SSL 인증서를 발급받을 수 있습니다.

### 설치 (Ubuntu/Debian 기준)
```bash
sudo apt update
sudo apt install certbot
```

### 인증서 발급 (단독 모드)
Nginx가 실행 중이지 않은 상태에서 80번 포트를 사용하여 발급받습니다.
```bash
sudo certbot certonly --standalone -d translate.jbch.org
```

### 인증서 적용
발급된 인증서를 프로젝트의 `certs/` 폴더로 복사하거나 심볼릭 링크를 겁니다.
```bash
# 프로젝트 루트 디렉토리에서 실행
mkdir -p certs
sudo cp /etc/letsencrypt/live/translate.jbch.org/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/translate.jbch.org/privkey.pem ./certs/
sudo chown $USER:$USER ./certs/*.pem
```

---

## 2. 개발/테스트 환경: 자가 서명 인증서 (Self-signed)
공인 인증서가 없거나 내부망 테스트를 위해 급히 필요한 경우 사용합니다.

```bash
# 프로젝트 루트의 certs 폴더로 이동
mkdir -p certs
cd certs

# 1년 만기 인증서 생성
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=Organization/CN=translate.jbch.org"
```

---

## 3. Docker 서비스 실행
인증서 파일이 준비되었다면 Docker Compose를 통해 서비스를 실행합니다.

```bash
# 프로젝트 루트에서
docker-compose up -d --build
```

## 4. 확인 및 주의사항
1. **포트 개방**: 서버의 방화벽(AWS Security Group 등)에서 **80** 및 **443** 포트가 열려 있어야 합니다.
2. **도메인 연결**: 설정한 `server_name`(`translate.jbch.org`)이 실제 서버 IP를 가리키고 있어야 인증서 발급 및 접속이 가능합니다.
3. **Nginx 설정**: `nginx/default.conf` 내의 `ssl_certificate` 경로가 `/etc/nginx/certs/...`로 되어 있는지 확인하세요. (Docker 볼륨 마운트로 연결됨)
