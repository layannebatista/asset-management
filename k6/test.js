import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10, // usuários simultâneos
  duration: '30s',
};

export default function () {
  http.get('http://localhost:8080/actuator/health');
  sleep(1);
}