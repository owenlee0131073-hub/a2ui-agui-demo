import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { businessTripStagePath } from "@/business-trip/routes";
import styles from "./home-page.module.css";

export function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="출장 지원 시작">
        <div className={styles.background} aria-hidden="true" />
        <div className={styles.scrim} aria-hidden="true" />

        <nav className={styles.nav} aria-label="시작 페이지">
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>
              <BriefcaseBusiness size={18} strokeWidth={2.2} />
            </span>
            <span>Business Trip</span>
          </Link>
          <Link className={styles.navAction} href={businessTripStagePath("requirements")}>
            작업 공간
          </Link>
        </nav>

        <div className={styles.content}>
          <h1>Trip Planner</h1>
          <p>
            목적지, 일정, 예산, 승인 흐름을 한 번에 정리하고 필요한 순간에
            바로 검토합니다.
          </p>
          <div className={styles.actions}>
            <Link
              className={styles.primaryAction}
              href={businessTripStagePath("requirements")}
            >
              시작하기
              <ArrowRight size={18} strokeWidth={2.3} />
            </Link>
            <Link className={styles.secondaryAction} href="/business-trip">
              최근 흐름으로 이동
            </Link>
          </div>
        </div>

        <div className={styles.stageRail} aria-label="출장 계획 단계">
          <span>
            <strong className={styles.stepNum}>01</strong> 요청 조건
          </span>
          <span>
            <strong className={styles.stepNum}>02</strong> 일정 초안
          </span>
          <span>
            <strong className={styles.stepNum}>03</strong> 옵션 비교
          </span>
          <span>
            <strong className={styles.stepNum}>04</strong> 승인 검토
          </span>
          <span>
            <strong className={styles.stepNum}>05</strong> 확정안
          </span>
        </div>
      </section>
    </main>
  );
}
