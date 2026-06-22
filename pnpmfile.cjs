/**
 * CI 안정성을 위해 전이 의존성의 불안정한 postinstall을 비활성화한다.
 * postman-code-generators는 postinstall에서 자체 codegen 의존성 설치를 수행하는데,
 * GitHub Actions 환경에서 package manager 감지 오탐(yarn)으로 실패할 수 있다.
 */
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'postman-code-generators' && pkg.scripts?.postinstall) {
        delete pkg.scripts.postinstall;
      }
      return pkg;
    },
  },
};
