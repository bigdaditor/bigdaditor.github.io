# Rust 1시간 속성 가이드 - Java 5년차 개발자용

> **목표**: 웹 프레임워크 기여 가능 + 멀티스레드 코딩 가능 수준까지

---

## 1. 소유권 (Ownership) - Rust의 핵심

Java는 GC가 메모리 관리. Rust는 **컴파일 타임에 메모리 관리 강제**.

```rust
fn main() {
    let s1 = String::from("햄");
    let s2 = s1;  // s1의 소유권이 s2로 "이동" (move)
    // println!("{}", s1);  // ❌ 컴파일 에러! s1은 이제 무효
    println!("{}", s2);     // ✅ OK
}
```

**Java 마인드 번역**: `s1 = null`이 자동으로 된다고 생각. 단, 컴파일러가 강제함.

---

## 2. 빌림 (Borrowing) - 참조의 규칙

```rust
fn main() {
    let s = String::from("햄");
    
    // 불변 빌림 - 여러 개 가능
    let r1 = &s;
    let r2 = &s;  // ✅ OK
    
    // 가변 빌림 - 딱 하나만
    let mut s2 = String::from("햄");
    let r3 = &mut s2;
    // let r4 = &mut s2;  // ❌ 컴파일 에러!
}
```

### 핵심 규칙
| 규칙 | 설명 |
|------|------|
| 불변 참조 `&T` | 여러 개 OK |
| 가변 참조 `&mut T` | 딱 하나만 |
| 동시 존재 | 불변 + 가변 동시에 불가 |

→ **data race를 컴파일 타임에 방지**

---

## 3. `::` 연산자와 `From` 트레이트

### `::` = 연관 함수 호출 (Java의 static 메서드)

```rust
// String::from은 이렇게 구현되어 있음
impl String {
    pub fn from(s: &str) -> String {
        // &str을 String으로 변환
    }
}

// 호출
let s = String::from("햄");  // Java: String.from("햄")

// new도 마찬가지
impl User {
    pub fn new(name: String) -> Self {
        User { name }
    }
}
let user = User::new(String::from("햄"));
```

### `From` 트레이트 - 타입 변환 표준

```rust
// From을 구현하면 Into도 자동 구현
let s1 = String::from("햄");   // from 사용
let s2: String = "햄".into();  // into 사용 (타입 명시 필요)
```

### `&str` vs `String`
| 타입 | 설명 | Java 대응 |
|------|------|----------|
| `&str` | 문자열 슬라이스 (불변, 어디든 위치 가능) | - |
| `String` | 힙 할당 가변 문자열 | `String` |

---

## 4. 모듈 시스템 & Import/Export

### 파일 구조

```
my_project/
├── Cargo.toml
└── src/
    ├── main.rs          # 바이너리 진입점
    ├── lib.rs           # 라이브러리 루트
    ├── user.rs          # user 모듈
    └── services/        # 서브 모듈 디렉토리
        ├── mod.rs       # services 모듈 정의
        └── auth.rs      # services::auth 모듈
```

### 모듈 선언 & 내보내기

```rust
// src/user.rs
pub struct User {          // pub = public
    pub name: String,      // 필드도 pub 붙여야 외부 접근 가능
    age: u32,              // private (pub 없음)
}

impl User {
    pub fn new(name: String, age: u32) -> Self {
        User { name, age }
    }
    
    pub fn greet(&self) -> String {
        format!("안녕 난 {}", self.name)
    }
    
    fn secret(&self) {}  // private 메서드
}

pub fn some_function() {}  // public 함수
```

### 모듈 등록 (⚠️ Java와 다른 점!)

```rust
// src/main.rs 또는 src/lib.rs
mod user;      // user.rs 모듈로 등록 (명시 필수!)
mod services;  // services/mod.rs 모듈로 등록

fn main() {
    let u = user::User::new(String::from("햄"), 20);
}
```

### 서브 모듈

```rust
// src/services/mod.rs
pub mod auth;  // auth.rs를 서브모듈로 등록 + 외부 공개

// src/services/auth.rs
pub fn login(id: &str) -> bool {
    true
}
```

### use - Import

```rust
// 기본
use crate::user::User;       // crate = 현재 프로젝트 루트
use crate::services::auth;

// 여러 개
use std::collections::{HashMap, HashSet, VecDeque};

// 전부 (비추)
use std::collections::*;

// 별칭
use std::collections::HashMap as Map;

// 중첩
use std::{
    io::{self, Read, Write},  // self = std::io 자체도
    fs::File,
};
```

### pub use - 재내보내기

```rust
// src/lib.rs
mod user;
pub use user::User;  // 외부에서 my_crate::User로 접근 가능
```

### 가시성 정리

| Rust | Java 대응 | 범위 |
|------|----------|------|
| `pub` | `public` | 어디서든 |
| (없음) | `private` | 같은 모듈 |
| `pub(crate)` | package-private | 같은 크레이트 |
| `pub(super)` | protected 비슷 | 부모 모듈까지 |

### 외부 크레이트

```toml
# Cargo.toml
[dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }
```

```rust
use serde::{Serialize, Deserialize};
use tokio::fs::File;
```

---

## 5. 타입 시스템 - trait

```rust
// Java interface = Rust trait
trait Greet {
    fn greet(&self) -> String;
}

struct Developer {
    name: String,
}

impl Greet for Developer {
    fn greet(&self) -> String {
        format!("{}입니다", self.name)
    }
}

// 제네릭 + trait bound (Java의 <T extends Interface>)
fn say_hello<T: Greet>(entity: &T) {
    println!("{}", entity.greet());
}

// 여러 trait bound
fn do_something<T: Clone + Debug>(item: T) {}

// where 절 (복잡할 때)
fn complex<T, U>(t: T, u: U)
where
    T: Clone + Debug,
    U: Serialize,
{}
```

---

## 6. 에러 처리 - Exception 없음

```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("0으로 나누기 불가".to_string())
    } else {
        Ok(a / b)
    }
}

fn main() {
    // 방법 1: match
    match divide(10, 0) {
        Ok(result) => println!("결과: {}", result),
        Err(e) => println!("에러: {}", e),
    }
    
    // 방법 2: ? 연산자 (에러 전파, throws 같은 거)
    fn calc() -> Result<i32, String> {
        let x = divide(10, 2)?;  // 에러면 바로 return Err
        Ok(x * 2)
    }
    
    // 방법 3: unwrap (panic 발생, 프로덕션 비추)
    let result = divide(10, 2).unwrap();
    
    // 방법 4: unwrap_or (기본값)
    let result = divide(10, 0).unwrap_or(0);
}
```

---

## 7. Option - null 없음

```rust
fn find_user(id: i32) -> Option<String> {
    if id == 1 {
        Some("햄".to_string())
    } else {
        None
    }
}

fn main() {
    // if let 패턴
    if let Some(name) = find_user(1) {
        println!("찾음: {}", name);
    }
    
    // match
    match find_user(1) {
        Some(name) => println!("{}", name),
        None => println!("없음"),
    }
    
    // unwrap_or
    let name = find_user(999).unwrap_or("익명".to_string());
    
    // map (체이닝)
    let upper = find_user(1).map(|n| n.to_uppercase());
}
```

---

## 8. 구조체 & impl

```rust
struct User {
    name: String,
    age: u32,
}

impl User {
    // 생성자 (연관 함수)
    fn new(name: String, age: u32) -> Self {
        User { name, age }
    }
    
    // 인스턴스 메서드 (&self = this, 불변)
    fn introduce(&self) -> String {
        format!("{}살 {}", self.age, self.name)
    }
    
    // 가변 메서드 (&mut self)
    fn birthday(&mut self) {
        self.age += 1;
    }
    
    // 소유권 가져가는 메서드 (self)
    fn destroy(self) {
        println!("{} 삭제됨", self.name);
        // 이후 self 사용 불가
    }
}
```

---

## 9. Enum - Java enum의 강화판

```rust
// 각 variant가 다른 데이터 보유 가능
enum Message {
    Quit,                        // 데이터 없음
    Move { x: i32, y: i32 },     // 구조체 형태
    Write(String),               // 튜플 형태
    ChangeColor(i32, i32, i32),  // 여러 값
}

fn process(msg: Message) {
    match msg {
        Message::Quit => println!("종료"),
        Message::Move { x, y } => println!("이동: {}, {}", x, y),
        Message::Write(text) => println!("쓰기: {}", text),
        Message::ChangeColor(r, g, b) => println!("색: {}/{}/{}", r, g, b),
    }
}

// Result, Option도 사실 enum
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

---

## 10. 멀티스레딩

```rust
use std::thread;
use std::sync::{Arc, Mutex};

fn main() {
    // Arc = Atomic Reference Count (스레드 안전 참조 카운트)
    // Mutex = 뮤텍스 (Java synchronized 비슷)
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);  // Arc 복제
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();  // 스레드 종료 대기
    }

    println!("결과: {}", *counter.lock().unwrap());  // 10
}
```

### 스레드 안전 타입

| 타입 | 용도 |
|------|------|
| `Arc<T>` | 여러 스레드에서 소유권 공유 |
| `Mutex<T>` | 상호 배제 (한 번에 하나만 접근) |
| `RwLock<T>` | 읽기 여러 개, 쓰기 하나 |
| `Atomic*` | 원자적 연산 (AtomicBool, AtomicUsize 등) |

**Java와 차이점**: 컴파일러가 `Send`, `Sync` trait으로 data race 가능성을 **컴파일 에러로 잡음**.

---

## 11. 채널 - 스레드 간 통신

```rust
use std::sync::mpsc;  // multi-producer, single-consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 송신측
    thread::spawn(move || {
        tx.send("햄에서 보냄".to_string()).unwrap();
    });

    // 수신측
    let received = rx.recv().unwrap();
    println!("받음: {}", received);
    
    // 여러 producer
    let (tx, rx) = mpsc::channel();
    let tx2 = tx.clone();  // 송신자 복제 가능
    
    thread::spawn(move || tx.send(1).unwrap());
    thread::spawn(move || tx2.send(2).unwrap());
    
    for received in rx {
        println!("{}", received);
    }
}
```

---

## 12. Async/Await - 웹 프레임워크 필수

```rust
// async 함수 정의
async fn fetch_data() -> Result<String, Error> {
    let response = reqwest::get("https://api.example.com")
        .await?   // 비동기 대기
        .text()
        .await?;
    Ok(response)
}

// Axum 웹 프레임워크 예시
use axum::{routing::get, Router};

async fn hello() -> &'static str {
    "Hello, 햄!"
}

#[tokio::main]  // async main을 위한 매크로
async fn main() {
    let app = Router::new()
        .route("/", get(hello));
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### 주요 async 런타임

| 런타임 | 특징 |
|--------|------|
| `tokio` | 가장 인기, 대부분 웹 프레임워크 사용 |
| `async-std` | std 라이브러리 스타일 |

---

## 13. 라이프타임 - 처음엔 컴파일러 따라가기

```rust
// 컴파일러가 참조 유효 범위 추적
// 대부분 자동 추론, 가끔 명시 필요

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// 'a = "x, y 중 더 짧은 수명만큼 결과 유효"

// 구조체에 참조 담을 때
struct Excerpt<'a> {
    part: &'a str,
}

// 팁: 처음엔 컴파일러가 시키는 대로 'a 붙여. 나중에 이해됨.
```

---

## 14. Cargo - 빌드 도구

```bash
cargo new my_project     # 프로젝트 생성
cargo build              # 빌드
cargo build --release    # 릴리즈 빌드 (최적화)
cargo run                # 빌드 + 실행
cargo test               # 테스트
cargo add tokio          # 의존성 추가
cargo doc --open         # 문서 생성 및 열기
```

### Cargo.toml

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.7"
serde = { version = "1", features = ["derive"] }

[dev-dependencies]
criterion = "0.5"  # 벤치마크용
```

---

## 15. 자주 쓰는 매크로 & derive

```rust
#[derive(Debug)]           // {:?} 포맷 출력
#[derive(Clone)]           // .clone() 메서드
#[derive(Copy)]            // 이동 대신 복사 (작은 타입만)
#[derive(PartialEq, Eq)]   // == 비교
#[derive(Hash)]            // HashMap 키로 사용
#[derive(Default)]         // Default::default() 생성
#[derive(Serialize, Deserialize)]  // serde JSON 변환

#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
}

// 매크로
println!("출력: {}", value);      // 포맷 출력
format!("문자열: {}", value);     // String 생성
vec![1, 2, 3];                    // Vec 생성
panic!("치명적 에러!");            // 프로그램 중단
todo!();                          // 미구현 표시 (panic)
unreachable!();                   // 도달 불가 표시
```

---

## 16. 실전 프로젝트 구조 예시

```
src/
├── main.rs
├── lib.rs
├── models/
│   ├── mod.rs
│   ├── user.rs
│   └── post.rs
├── services/
│   ├── mod.rs
│   ├── user_service.rs
│   └── post_service.rs
└── handlers/
    ├── mod.rs
    └── api.rs
```

```rust
// src/lib.rs
pub mod models;
pub mod services;
pub mod handlers;

pub use models::user::User;
pub use models::post::Post;

// src/models/mod.rs
pub mod user;
pub mod post;

// src/main.rs
use my_project::{User, services::user_service};

fn main() {
    let user = User { id: 1, name: "햄".into() };
    user_service::save(&user);
}
```

---

## Java → Rust 번역표

| Java | Rust |
|------|------|
| `class` | `struct` + `impl` |
| `interface` | `trait` |
| `extends/implements` | `impl Trait for Struct` |
| `null` | `Option<T>` |
| `try-catch` | `Result<T, E>` + `?` |
| `final` | 기본값 (mut 없으면 불변) |
| `synchronized` | `Mutex<T>` |
| `volatile` | `Atomic*` 타입들 |
| GC | 소유권 시스템 |
| `new Foo()` | `Foo::new()` 또는 `Foo { }` |
| `this` | `self` |
| `static` 메서드 | `::` 연관 함수 |
| `package` | `mod` |
| `import` | `use` |
| `public` | `pub` |
| Maven/Gradle | Cargo |
| `Optional<T>` | `Option<T>` |
| `CompletableFuture` | `async`/`await` |
| `Thread` | `std::thread` |
| `ExecutorService` | `tokio` 런타임 |

---

## 시작하기

```bash
# Rust 설치
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 프로젝트 시작
cargo new rust_practice
cd rust_practice
cargo run

# IDE: VS Code + rust-analyzer 확장 추천
```

---

## 추천 학습 순서

1. ✅ 이 문서로 개념 파악
2. 📖 [Rust Book](https://doc.rust-lang.org/book/) - 공식 문서
3. 🏋️ [Rustlings](https://github.com/rust-lang/rustlings) - 연습 문제
4. 🔧 작은 프로젝트 직접 만들어보기
5. 🌐 웹 프레임워크(Axum, Actix-web) 튜토리얼 따라하기

---

*Java 5년차 기준 1시간 내 웹 프레임워크 기여 + 멀티스레드 코딩 가능 목표 가이드*
