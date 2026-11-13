# Bloomora

[![CI](https://github.com/LenionK/Bloomora/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/LenionK/Bloomora/actions/workflows/ci.yml)

An ad-free calendar and day planner for your phone, built with React Native and Expo.

> **Status:** in active development. The features marked below work today, but no installable APK has been published yet.

## Why

Most calendar apps on the Play Store are full of ads or lock basic features behind a subscription. Bloomora is a simple alternative with no ads and nothing locked.

## Features

- [x] Monthly calendar with the next activity always in view
- [x] Daily timeline showing the free time between activities
- [x] Add, edit and delete activities
- [x] Activities that repeat on chosen weekdays, with single dates that can be skipped
- [x] Daily progress on the activities marked as done
- [x] Swipe between months and days
- [x] Activities stored on the device, with no account needed
- [x] Settings to see the space used and delete old activities
- [x] Daily water tracker, filling a bottle one 200 ml glass at a time towards 2 litres
- [ ] Notifications before activities and reminders to drink
- [x] Stats with water streaks and scores for activities and water
- [ ] Export activities to an `.ics` file for Google Calendar and other calendar apps
- [ ] Save activities directly to the phone's calendar

Android comes first, with iOS planned for later.

## Tech stack

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Getting started

You need [Node.js](https://nodejs.org/) 22.13 or later, and the [Expo Go](https://expo.dev/go) app on your phone.

```bash
git clone https://github.com/LenionK/Bloomora.git
cd Bloomora
npm install
npx expo start
```

Then scan the QR code with Expo Go. Your phone and computer must be on the same Wi-Fi network.

To check the code:

```bash
npm run lint
npm run typecheck
npm test
```

## License

MIT — see [LICENSE](LICENSE).
