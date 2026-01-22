import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { MongooseSchemasModule } from './infrastructure/database/mongoose/mongoose.module';

@Module({
  imports: [PrismaModule, MongooseSchemasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
