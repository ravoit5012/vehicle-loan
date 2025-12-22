import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  checkHealth() {
    return "The backend is listening properly";
  }
  
  setHealth(status: string) {
    return `Health status set to: ${status}`;
  }
}
