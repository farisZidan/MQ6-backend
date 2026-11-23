import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Konfigurasi CORS (Cross-Origin Resource Sharing)
  app.enableCors({
    // Gunakan fungsi agar mendukung credentials (cookie/token) tanpa memblokir browser.
    // Ini mengizinkan semua origin, TAPI mengembalikan origin asli pemanggil (bukan '*')
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: string | boolean) => void) => {
      // Izinkan request tanpa origin (seperti Postman/curl)
      if (!origin) return callback(null, true);
      // Izinkan semua origin yang masuk
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Wajib diaktifkan agar class-validator (DTO) bekerja, misal untuk LoginDto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Otomatis buang field yang tidak ada di DTO
      forbidNonWhitelisted: true, // Lempar error jika ada field asing
      transform: true, // Otomatis ubah tipe data (misal string ke number di query param)
    }),
  );

  // 3. Jalankan server
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
