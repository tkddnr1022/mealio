import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  providers: [KafkaService, KafkaProducerService],
  exports: [KafkaService, KafkaProducerService],
})
export class KafkaModule {}
