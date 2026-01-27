import { Module } from '@nestjs/common';
import { KafkaProducerService } from './producer.service';
import { KafkaAdminService } from './kafka-admin.service';

@Module({
  providers: [KafkaProducerService, KafkaAdminService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
